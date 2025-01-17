import json
import os
import traceback
from typing import Union, cast
import uuid
from fastapi.exceptions import RequestValidationError
import nbformat as nbf
import nest_asyncio
from dotenv import load_dotenv
from fastapi import APIRouter, BackgroundTasks, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from genai.exceptions import ApiNetworkException, ApiResponseException
from ibm_watsonx_ai.wml_client_error import (
    ApiRequestFailure,
    CannotSetProjectOrSpace,
    WMLClientError,
)
from llmasajudge.benchmark.utils import get_all_benchmarks
from llmasajudge.evaluators import EvaluatorNameEnum as EvaluatorNameEnumOld,  GraniteGuardianRubricEvaluator, ModelProviderEnum as ModelProviderEnumOld, get_rubric_evaluator
from openai import AuthenticationError
from prisma.errors import PrismaError
from prisma.models import StoredUseCase
from pydantic import BaseModel
from unitxt.llm_as_judge import (
    DIRECT_CRITERIAS,
    EVALUATORS_METADATA,
    EVALUATOR_TO_MODEL_ID,
    PAIRWISE_CRITERIAS,
    Criteria,
    CriteriaOption,
    CriteriaWithOptions,
    EvaluatorNameEnum,
    EvaluatorTypeEnum,
    ModelProviderEnum,
    rename_model_if_required,
)
import logging
from .api.pairwise import (
    CriteriaAPI,
    PairwiseEvalRequestModel,
    PairwiseEvalResponseModel,
)

# API type definitions
from .api.pipelines import EvaluatorMetadataAPI, PipelinesResponseModel
from .api.rubric import (
    CriteriaOptionAPI,
    CriteriaWithOptionsAPI,
    RubricEvalRequestModel,
    RubricEvalResponseModel,
)
from .db_client import db
from .evaluators.unitxt import DirectAssessmentEvaluator, PairwiseComparisonEvaluator, get_enum_by_value, get_inference_engine_params

# Logging req/resp
from .logger import LoggingRoute

nest_asyncio.apply()
load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

router = APIRouter(route_class=LoggingRoute)


class HealthCheck(BaseModel):
    status: str = "OK"


class PostEvaluationBody(BaseModel):
    name: str


class MissingColumnsException(Exception):
    def __init__(self, message):
        self.message = message


@router.get(
    "/health",
    tags=["healthcheck"],
    summary="Perform a Health Check",
    response_description="Return HTTP Status Code 200 (OK)",
    status_code=status.HTTP_200_OK,
    response_model=HealthCheck,
)
def get_health() -> HealthCheck:
    return HealthCheck(status="OK")


@app.on_event("shutdown")
async def app_shutdown():
    db.disconnect()


def throw_authorized_exception():
    raise HTTPException(
        status_code=401, detail="Couldn't connect to BAM. Please check that the provided API key is correct."
    )


@router.get("/evaluators/", response_model=PipelinesResponseModel)
def get_evaluators():
    """Get the list of available pipelines, as supported by llm-as-a-judge library"""
    evaluators = [EvaluatorMetadataAPI(**e.__dict__) for e in EVALUATORS_METADATA]
    # for e in AVAILABLE_EVALUATORS:
    #     if e.metadata.name.value in [EvaluatorNameEnum.GRANITE_GUARDIAN_2B.value, EvaluatorNameEnum.GRANITE_GUARDIAN_8B.value]:
    #         pipelines.extend(EvaluatorMetadataAPI(
    #             name=e.metadata.name.value,
    #             option_selection_strategy=OptionSelectionStrategyEnum.PARSE_OUTPUT_TEXT.value,
    #             providers=['watsonx']))
    return PipelinesResponseModel(evaluators=evaluators)


@router.get("/criterias/")
def get_criterias():
    """Get the list of available criterias"""
    return {
        "direct": [
            CriteriaWithOptionsAPI(
                name=c.name,
                description=c.description,
                options=[CriteriaOptionAPI(name=o.name, description=o.description) for o in c.options],
            )
            for c in DIRECT_CRITERIAS
        ],
        "pairwise": [CriteriaAPI(name=c.name, description=c.description) for c in PAIRWISE_CRITERIAS],
    }


@router.post("/prompt/", response_model=list[str])
def get_prompt(req: RubricEvalRequestModel):
    gg_evaluator: GraniteGuardianRubricEvaluator = get_rubric_evaluator(
        name=EvaluatorNameEnumOld.GRANITE_GUARDIAN_2B,
        credentials=req.llm_provider_credentials,
        provider=ModelProviderEnumOld[req.provider.name],
    )
    criteria = CriteriaWithOptions(
        name=req.criteria.name,
        description=req.criteria.criteria,
        options=req.criteria.options,
    )

    res = gg_evaluator.get_prompt(
        contexts=[req.context_variables] * len(req.responses),
        responses=req.responses,
        criteria=[criteria] * len(req.responses),
        response_variable_name_list=[req.response_variable_name] * len(req.responses),
    )
    return res


@router.post("/evaluate/", response_model=Union[RubricEvalResponseModel, PairwiseEvalResponseModel])
async def evaluate(req: RubricEvalRequestModel | PairwiseEvalRequestModel):
    try:
        if req.type == EvaluatorTypeEnum.DIRECT:
            if req.evaluator_name in [EvaluatorNameEnum.GRANITE_GUARDIAN_2B, EvaluatorNameEnum.GRANITE_GUARDIAN_8B]:
                evaluator = get_rubric_evaluator(
                    name=EvaluatorNameEnumOld[req.evaluator_name.name],
                    credentials=req.llm_provider_credentials,
                    provider=ModelProviderEnumOld[req.provider.name],
                )
                res = evaluator.evaluate(
                    contexts=[req.context_variables] * len(req.responses),
                    responses=req.responses,
                    criteria=[req.criteria] * len(req.responses),
                    response_variable_name_list=[req.response_variable_name] * len(req.responses),
                    check_bias=True,
                )
                for r in res:
                    r["summary"] = r["explanation"]
                    del r["explanation"]
                return RubricEvalResponseModel(results=res)

            evaluator = DirectAssessmentEvaluator(req.evaluator_name)
            criteria = (
                CriteriaWithOptions(
                    name=req.criteria.name,
                    description=req.criteria.description,
                    options=[
                        CriteriaOption(name=o.name, description=o.description)
                        for o in cast(CriteriaWithOptionsAPI, req.criteria).options
                    ],
                )
                if not isinstance(req.criteria, str)
                else req.criteria
            )
        else:
            evaluator = PairwiseComparisonEvaluator(req.evaluator_name)
            criteria = (
                Criteria(name=req.criteria.name, description=req.criteria.description)
                if not isinstance(req.criteria, str)
                else req.criteria
            )

        res = evaluator.evaluate(
            contexts=[req.context_variables] * len(req.responses),
            responses=req.responses,
            criteria=criteria,
            # response_variable_name_list=[req.response_variable_name] * len(req.responses),
            credentials=req.llm_provider_credentials,
            provider=req.provider,
        )
        if req.type == EvaluatorTypeEnum.DIRECT:
            return RubricEvalResponseModel(results=res)
        else:
            return PairwiseEvalResponseModel(results=res)

    except ValueError as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))
    except ApiResponseException as e:
        if e.response.error == "Unauthorized":
            throw_authorized_exception()
        print("raised ApiResponseException")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"{e.response.error}. {e.response.message}")
    except ApiNetworkException:
        # I think the random errors thrown by BAM are of type ApiNetworkException, lets maintain error
        # handling this way till we know better how they are thrown
        print("raised ApiNetworkException")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Something went wrong running the evaluation. Please try again.")
    except ApiRequestFailure as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=e.error_msg)
    except AuthenticationError:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail="Invalid OPENAI credentials provided.")
    except CannotSetProjectOrSpace as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"watsonx authentication failed: {e.error_msg}")
    except WMLClientError as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"watsonx authentication failed: {e.error_msg}")
    except AssertionError as e:
        raise HTTPException(status_code=400, detail=f"{e}")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=e.error_msg if hasattr(e, "error_msg") else "Unknown error.")



@router.get("/use_case/")
def get_use_cases(user: str):
    use_cases = db.storedusecase.find_many(where={"app_user": {"email": user}})
    return use_cases


@router.get("/use_case/{use_case_id}/")
def get_use_case(use_case_id: int, user: str):
    return db.storedusecase.find_unique(where={"id": use_case_id})


class PutUseCaseBody(BaseModel):
    user: str
    use_case: StoredUseCase


@router.put("/use_case/")
def put_use_case(request_body: PutUseCaseBody):
    user = db.appuser.find_unique(where={"email": request_body.user})

    found = db.storedusecase.find_unique(
        where={
            "id": request_body.use_case.id,
            "user_id": user.id,
        }
    )

    if found:
        res = db.storedusecase.update(
            where={"id": request_body.use_case.id},
            data={
                "name": request_body.use_case.name,
                "content": json.dumps(request_body.use_case.content),
            },
        )

    else:

        name_and_user_exists = db.storedusecase.find_many(
            where={
                "name": request_body.use_case.name,
                "user_id": user.id,
            }
        )

        if name_and_user_exists:
            raise HTTPException(status_code=409, detail=f"The name '{request_body.use_case.name}' is already in use")

        else:
            res = db.storedusecase.create(
                data={
                    "name": request_body.use_case.name,
                    "content": json.dumps(request_body.use_case.content),
                    "user_id": user.id,
                }
            )

    return res


class DeleteUseCaseBody(BaseModel):
    use_case_id: int


@router.delete("/use_case/")
def delete_use_case(request_body: DeleteUseCaseBody):
    res = db.storedusecase.delete(where={"id": request_body.use_case_id})
    return res


class CreateUserPostBody(BaseModel):
    email: str
    name: str | None = None


@router.post("/user/")
def create_user_if_not_exist(user: CreateUserPostBody):
    try:
        db_user = db.appuser.find_unique(where={"email": user.email})
        if db_user is None:
            db_user = db.appuser.create(data={"email": user.email, "name": user.name if user.name is not None else ""})
        return db_user
    except PrismaError as pe:
        print(f"Prisma error raised: {pe}")
        return None


@router.get("/benchmarks/")
def get_benchmarks():
    # version = pkg_resources.get_distribution("llmasajudge").version
    # print(version)
    json_data = get_all_benchmarks()
    return json_data


class NotebookParams(BaseModel):
    test_case_name: str
    criteria: dict
    evaluator_name: EvaluatorNameEnum
    provider: ModelProviderEnum
    responses: list
    context_variables: list
    credentials: dict[str, str]
    evaluator_type: EvaluatorTypeEnum

def cleanup_file(filepath: str):
    """Safely remove a file after it has been served."""
    try:
        os.remove(filepath)
        print(f"Deleted file: {filepath}")
    except FileNotFoundError:
        print(f"File not found for deletion: {filepath}")
    except Exception as e:
        print(f"Error deleting file: {filepath}, {e}")

@router.post("/download-notebook/")
def download_notebook(params: NotebookParams, background_tasks: BackgroundTasks):
    # Validate inputs
    if not params.criteria or not params.evaluator_name or not params.responses or not params.context_variables:
        raise HTTPException(status_code=400, detail="Missing required fields")

    inference_engine_params = get_inference_engine_params(provider=params.provider, evaluator_name=params.evaluator_name, credentials=params.credentials)
    inference_engine_params_string = ','.join([f"{k}={repr(v) if isinstance(v, str) else v}" for k,v in inference_engine_params.items()])
    
    parsed_context_variables = {
        item["variable"]: item["value"]
        for item in params.context_variables
    }
    input_fields = {k: 'str' for k in parsed_context_variables.keys()}
    context_fields = list(parsed_context_variables.keys())
    

    nb = nbf.v4.new_notebook()

    title = f"# Unitxt sample notebook: {params.test_case_name}'\n\nThis notebook was generated automatically from your EvalAssist test case '{params.test_case_name}'. It contains code to evaluate a set of responses using the specified criteria and evaluator.\n\n"
    import_md = "### Import the necessary libraries"
    import_code = f"""
from unitxt.api import evaluate, create_dataset
from unitxt.inference import LiteLLMInferenceEngine
from unitxt.llm_as_judge import LLMJudgeDirect, EvaluatorNameEnum, CriteriaWithOptions
from unitxt.task import Task
from unitxt.templates import NullTemplate
import pandas as pd
import nest_asyncio
nest_asyncio.apply()
"""
    
    load_dataset_md = """### Laoding the dataset
This code block creates a dataset from the context variables and the prediction. It simulates the sceario where the dataset is loaded from a csv file.
"""
    load_dataset_code = f"""context_variables = {parsed_context_variables}
predictions = {params.responses}
dataset_rows = [context_variables | {{'prediction': prediction}} for prediction in predictions]
df = pd.DataFrame(dataset_rows)
# load a csv if data is stored in a csv file
# df = pd.read_csv(file_path)
"""
    
    load_criteria_md = """### Load the criteria
The criteria in direct evaluation need an option map that matches a string to a numerical value. This code block creates an option map, but it may not be accurate as it assume equal distribution between 0 and 1 and ascending order.
"""
    options_count = len(params.criteria['options'])
    option_value_step = 1 / (options_count - 1)
    default_option_map = {option['name']: option_value_step * i for i, option in enumerate(params.criteria['options'])}
    criteria = params.criteria | {"option_map": default_option_map}
    load_criteria_code = f"""
option_map = {default_option_map}
criteria = CriteriaWithOptions.from_obj({criteria})
"""
    setup_md = """### Setup the evaluation
This code block creates the evaluator object of class _LLMJudgeDirect_. It then creates a dataset object from the context variables. 
"""
    setup_code = f"""metric = LLMJudgeDirect(    
    evaluator_name={f"EvaluatorNameEnum.{get_enum_by_value(params.evaluator_name).name}.name"},
    inference_engine=LiteLLMInferenceEngine({inference_engine_params_string}),
    criteria=criteria,
    context_fields={context_fields},
    criteria_field="criteria",
)
dataset_content = df.drop(columns=['prediction']).to_dict(orient='records')
dataset = create_dataset(
    task=Task(
        input_fields={input_fields},
        reference_fields={{}},
        prediction_type=str,
        default_template=NullTemplate(),
        metrics=[metric],
    ),
    test_set=dataset_content,
    split="test")
"""
    evaluation_md = "### Evaluate the responses and print the results"
    evaluation_code = f"""predictions = df['prediction'].tolist()
results = evaluate(predictions=predictions, data=dataset)
print("Global Scores:")
print(results.global_scores.summary)

print("Instance Scores:")
print(results.instance_scores.summary)
"""

    nb.cells.append(nbf.v4.new_markdown_cell(title))
    nb.cells.append(nbf.v4.new_markdown_cell(import_md))
    nb.cells.append(nbf.v4.new_code_cell(import_code))
    nb.cells.append(nbf.v4.new_markdown_cell(load_dataset_md))
    nb.cells.append(nbf.v4.new_code_cell(load_dataset_code))
    nb.cells.append(nbf.v4.new_markdown_cell(load_criteria_md))
    nb.cells.append(nbf.v4.new_code_cell(load_criteria_code))
    nb.cells.append(nbf.v4.new_markdown_cell(setup_md))
    nb.cells.append(nbf.v4.new_code_cell(setup_code))
    nb.cells.append(nbf.v4.new_markdown_cell(evaluation_md))
    nb.cells.append(nbf.v4.new_code_cell(evaluation_code))

    # Define file path
    if not os.path.exists("generated_notebooks"):
        os.mkdir("generated_notebooks")

    if not os.path.exists(os.path.join("generated_notebooks", params.evaluator_type.value)):
        os.mkdir(os.path.join("generated_notebooks", params.evaluator_type.value))

    notebook_path = os.path.join("generated_notebooks", params.evaluator_type.value, f"{uuid.uuid4().hex}.ipynb")

    with open(notebook_path, "w") as f:
        nbf.write(nb, f)

    background_tasks.add_task(cleanup_file, notebook_path)

    return FileResponse(notebook_path, media_type="application/x-ipynb+json", filename="generated_notebook.ipynb")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
	exc_str = f'{exc}'.replace('\n', ' ').replace('   ', ' ')
	logging.error(f"{request}: {exc_str}")
	content = {'status_code': 10422, 'message': exc_str, 'data': None}
	return JSONResponse(content=content, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)

app.include_router(router)
