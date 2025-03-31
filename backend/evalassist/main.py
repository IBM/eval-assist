import logging
import logging.handlers
import os
import traceback
import uuid
from typing import Union, cast

import nbformat as nbf
import nest_asyncio
from fastapi import APIRouter, BackgroundTasks, FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from ibm_watsonx_ai.wml_client_error import (
    ApiRequestFailure,
    CannotSetProjectOrSpace,
    WMLClientError,
)
from langchain_core.exceptions import OutputParserException
from openai import AuthenticationError
from prisma.errors import PrismaError
from prisma.models import StoredUseCase
from pydantic import BaseModel
from unitxt.llm_as_judge import (
    DIRECT_CRITERIA,
    PAIRWISE_CRITERIA,
    Criteria,
    CriteriaOption,
    CriteriaWithOptions,
    EvaluatorTypeEnum,
)

from .api.common import (
    CriteriaAPI,
    CriteriaOptionAPI,
    CriteriaWithOptionsAPI,
    DirectEvaluationRequestModel,
    DirectResponseModel,
    NotebookParams,
    PairwiseEvaluationRequestModel,
    PairwiseResponseModel,
    SyntheticExampleGenerationRequest,
    SyntheticExampleGenerationResponse,
)

# API type definitions
from .api.pipelines import EvaluatorMetadataAPI, EvaluatorsResponseModel
from .benchmark.benchmark import get_all_benchmarks
from .const import EXTENDED_EVALUATORS_METADATA
from .db_client import db
from .evaluators.unitxt import (
    DirectAssessmentEvaluator,
    GraniteGuardianEvaluator,
    PairwiseComparisonEvaluator,
)

# Logging req/resp
from .logger import LoggingRoute
from .notebook_generation import DirectEvaluationNotebook, PairwiseEvaluationNotebook

# Synthetic
from .synthetic_example_generation.generate import Generator
from .utils import (
    get_custom_models,
    get_evaluator_metadata_wrapper,
    get_model_name_from_evaluator,
    init_evaluator_name,
)

logger = logging.getLogger(__name__)
logger = logger.setLevel(logging.DEBUG)
nest_asyncio.apply()

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


@router.get("/evaluators/", response_model=EvaluatorsResponseModel)
def get_evaluators():
    """Get the list of available pipelines, as supported by llm-as-a-judge library"""
    evaluators = [
        EvaluatorMetadataAPI(**e.__dict__) for e in EXTENDED_EVALUATORS_METADATA
    ]
    custom_models = get_custom_models()
    for custom_model in custom_models:
        evaluators.append(
            EvaluatorMetadataAPI(
                name=custom_model["name"], providers=custom_model["providers"]
            )
        )
    return EvaluatorsResponseModel(evaluators=evaluators)


@router.get("/criterias/")
def get_criterias():
    """Get the list of available criterias"""
    return {
        "direct": [
            CriteriaWithOptionsAPI(
                name=c.name,
                description=c.description,
                options=[
                    CriteriaOptionAPI(name=o.name, description=o.description)
                    for o in c.options
                ],
            )
            for c in DIRECT_CRITERIA
        ],
        "pairwise": [
            CriteriaAPI(name=c.name, description=c.description)
            for c in PAIRWISE_CRITERIA
        ],
    }


@router.post("/prompt/", response_model=list[str])
def get_prompt(req: DirectEvaluationRequestModel):
    evaluator = GraniteGuardianEvaluator(req.evaluator_name)

    res = evaluator.get_prompt(
        instances=req.instances,
        risk_name=req.criteria.name,
    )
    return res


@router.post(
    "/evaluate/", response_model=Union[DirectResponseModel, PairwiseResponseModel]
)
async def evaluate(req: DirectEvaluationRequestModel | PairwiseEvaluationRequestModel):
    evaluator_name, custom_model_name = init_evaluator_name(req.evaluator_name)
    try:
        if req.type == EvaluatorTypeEnum.DIRECT:
            if evaluator_name.name.startswith("GRANITE_GUARDIAN"):
                evaluator = GraniteGuardianEvaluator(evaluator_name)
            else:
                evaluator = DirectAssessmentEvaluator(evaluator_name, custom_model_name)
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
            evaluator = PairwiseComparisonEvaluator(evaluator_name, custom_model_name)
            criteria = (
                Criteria(name=req.criteria.name, description=req.criteria.description)
                if not isinstance(req.criteria, str)
                else req.criteria
            )

        res = evaluator.evaluate(
            instances=req.instances,
            criteria=criteria,
            # response_variable_name_list=[req.response_variable_name] * len(req.responses),
            credentials=req.llm_provider_credentials,
            provider=req.provider,
        )
        if req.type == EvaluatorTypeEnum.DIRECT:
            return DirectResponseModel(results=res)
        else:
            return PairwiseResponseModel(results=res)

    except ValueError as e:
        traceback.print_exc()

        raise HTTPException(status_code=400, detail=str(e))
    except ApiRequestFailure as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=e.error_msg)
    except AuthenticationError:
        traceback.print_exc()
        raise HTTPException(
            status_code=400, detail="Invalid OPENAI credentials provided."
        )
    except CannotSetProjectOrSpace as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=400, detail=f"watsonx authentication failed: {e.error_msg}"
        )
    except WMLClientError as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=400, detail=f"watsonx authentication failed: {e.error_msg}"
        )
    except AssertionError as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"{e}")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=400,
            detail=e.error_msg if hasattr(e, "error_msg") else "Unknown error.",
        )


@router.get("/test_case/")
def get_test_cases(user: str):
    test_cases = db.storedusecase.find_many(where={"app_user": {"email": user}})
    return test_cases


@router.get("/test_case/{test_case_id}/")
def get_test_case(test_case_id: int, user: str):
    test_case = db.storedusecase.find_unique(where={"id": test_case_id})
    return test_case


class PutUseCaseBody(BaseModel):
    user: str
    test_case: StoredUseCase


@router.put("/test_case/")
def put_test_case(request_body: PutUseCaseBody):
    user = db.appuser.find_unique(where={"email": request_body.user})

    found = db.storedusecase.find_unique(
        where={
            "id": request_body.test_case.id,
            "user_id": user.id,
        }
    )

    if found:
        res = db.storedusecase.update(
            where={"id": request_body.test_case.id},
            data={
                "name": request_body.test_case.name,
                "content": request_body.test_case.content,
            },
        )

    else:
        name_and_user_exists = db.storedusecase.find_many(
            where={
                "name": request_body.test_case.name,
                "user_id": user.id,
            }
        )

        if name_and_user_exists:
            raise HTTPException(
                status_code=409,
                detail=f"The name '{request_body.test_case.name}' is already in use",
            )

        else:
            res = db.storedusecase.create(
                data={
                    "name": request_body.test_case.name,
                    "content": request_body.test_case.content,
                    "user_id": user.id,
                }
            )

    return res


class DeleteUseCaseBody(BaseModel):
    test_case_id: int


@router.delete("/test_case/")
def delete_test_case(request_body: DeleteUseCaseBody):
    res = db.storedusecase.delete(where={"id": request_body.test_case_id})
    return res


class CreateUserPostBody(BaseModel):
    email: str
    name: str | None = None


@router.post("/user/")
def create_user_if_not_exist(user: CreateUserPostBody):
    try:
        db_user = db.appuser.find_unique(where={"email": user.email})
        if db_user is None:
            db_user = db.appuser.create(
                data={
                    "email": user.email,
                    "name": user.name if user.name is not None else "",
                }
            )
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


def cleanup_file(filepath: str):
    """Safely remove a file after it has been served."""
    logger = logging.getLogger(__name__)
    try:
        os.remove(filepath)
        logger.debug(f"Deleted file: {filepath}")
    except FileNotFoundError:
        logger.debug(f"File not found for deletion: {filepath}")
    except Exception as e:
        logger.debug(f"Error deleting file: {filepath}, {e}")


@router.post("/download-notebook/")
def download_notebook(params: NotebookParams, background_tasks: BackgroundTasks):
    # Validate inputs
    if (
        not hasattr(params, "criteria")
        or not hasattr(params, "evaluator_name")
        or not hasattr(params, "predictions")
        or not hasattr(params, "context_variables")
    ):
        raise HTTPException(status_code=400, detail="Missing required fields")
    evaluator_name, custom_model_name = init_evaluator_name(params.evaluator_name)
    evaluator_metadata = get_evaluator_metadata_wrapper(
        evaluator_name, custom_model_name
    )
    model_name = get_model_name_from_evaluator(evaluator_metadata, params.provider)
    params.model_name = model_name
    if params.evaluator_type == EvaluatorTypeEnum.DIRECT:
        nb = DirectEvaluationNotebook(params).generate_notebook()
    else:
        nb = PairwiseEvaluationNotebook(params).generate_notebook()
    from nbconvert import PythonExporter

    if params.plain_python_script:
        script, _ = PythonExporter().from_notebook_node(nb)
    result_content_file = nb if not params.plain_python_script else script
    root_folder = "generated_code"
    if not os.path.exists(os.path.join(root_folder)):
        os.mkdir(os.path.join(root_folder))
    file_format = {"ipynb" if not params.plain_python_script else "py"}
    file_path = os.path.join(root_folder, f"{uuid.uuid4().hex}.{file_format}")

    with open(file_path, "w") as f:
        if params.plain_python_script:
            f.write(result_content_file)
        else:
            nbf.write(result_content_file, f)

    background_tasks.add_task(cleanup_file, file_path)
    media_type = (
        "application/x-ipynb+json"
        if not params.plain_python_script
        else "text/x-python"
    )
    return FileResponse(
        file_path,
        media_type=media_type,
        filename=f"{params.evaluator_type}_generated_{'notebook' if not params.plain_python_script else 'script'}.{file_format}",
    )


@router.post("/synthetic-examples/", response_model=SyntheticExampleGenerationResponse)
def get_synthetic_examples(params: SyntheticExampleGenerationRequest):
    # populate config
    evaluator_name, custom_model_name = init_evaluator_name(params.evaluator_name)
    model_config = {
        "provider": params.provider,
        "llm_provider_credentials": params.llm_provider_credentials,
        "evaluator_name": evaluator_name,
        "custom_model_name": custom_model_name,
    }
    generation_config = {
        "context": params.context_variables_names,
        "response_variable_name": params.response_variable_name,
        "criteria": params.criteria,
        "gen_params": {
            "num_generations_per_criteria": 1,
            "min_new_tokens": 1,
            "max_new_tokens": 200,
            "temperature": 0.7,
        },
    }
    config = {"model": model_config, "generation": generation_config}

    # initialize generator and generate response
    generator = Generator(config)
    try:
        response = generator.generate()
    except OutputParserException as e:
        raise HTTPException(
            status_code=400,
            detail=f"{params.evaluator_name} was unable to generate an appropriate synthetic example",
        ) from e

    return SyntheticExampleGenerationResponse([response])

    # mocked_response = {c: "mocked" for c in params.context_variables_names}
    # mocked_response[params.response_variable_name] = "mocked"
    # mocked_response = {
    #   "response": "mocked"
    # }


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    exc_str = f"{exc}".replace("\n", " ").replace("   ", " ")
    logging.error(f"{request}: {exc_str}")
    content = {"status_code": 10422, "message": exc_str, "data": None}
    return JSONResponse(
        content=content, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
    )


app.include_router(router)
