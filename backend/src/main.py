import traceback
from typing import Optional, Union, cast
from fastapi import FastAPI, status, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .evaluators.unitxt import DirectAssessmentEvaluator, PairwiseComparisonEvaluator

from .api.pairwise import PairwiseEvalRequestModel, PairwiseEvalResponseModel
from .api.rubric import CriteriaWithOptionsAPI, RubricEvalRequestModel, RubricEvalResponseModel

from .db_client import db
import json
from prisma.models import StoredUseCase
from prisma.errors import PrismaError
# from llmasajudge.evaluators.rubric import GraniteGuardianRubricEvaluator
# from llmasajudge.benchmark.utils import get_all_benchmarks
from genai.exceptions import ApiResponseException, ApiNetworkException
from ibm_watsonx_ai.wml_client_error import ApiRequestFailure, CannotSetProjectOrSpace, WMLClientError
import json
from openai import AuthenticationError
from llmasajudge.evaluators import get_rubric_evaluator, RubricCriteria, EvaluatorNameEnum as EvaluatorNameEnumOld, ModelProviderEnum as ModelProviderEnumOld, GraniteGuardianRubricEvaluator
from llmasajudge.benchmark.utils import get_all_benchmarks
# API type definitions
from .api.pipelines import EvaluatorMetadataAPI, PipelinesResponseModel

# Logging req/resp
from .logger import LoggingRoute

from unitxt.eval_assist_constants import EVALUATORS_METADATA, EvaluatorNameEnum, OptionSelectionStrategyEnum, Criteria, CriteriaOption, EvaluatorTypeEnum, CriteriaWithOptions

import nest_asyncio
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

def throw_authorized_exception():
    raise HTTPException(status_code=401, detail=f"Couldn't connect to BAM. Please check that the provided API key is correct." )


@router.get("/evaluators/", response_model=PipelinesResponseModel)
def get_evaluators():
    '''Get the list of available pipelines, as supported by llm-as-a-judge library'''
    evaluators=[EvaluatorMetadataAPI(**e.__dict__) for e in EVALUATORS_METADATA]
    # for e in AVAILABLE_EVALUATORS:
    #     if e.metadata.name.value in [EvaluatorNameEnum.GRANITE_GUARDIAN_2B.value, EvaluatorNameEnum.GRANITE_GUARDIAN_8B.value]:
    #         pipelines.extend(EvaluatorMetadataAPI(
    #             name=e.metadata.name.value,
    #             option_selection_strategy=OptionSelectionStrategyEnum.PARSE_OUTPUT_TEXT.value, 
    #             providers=['watsonx']))
    return PipelinesResponseModel(evaluators=evaluators)

@router.post("/prompt/", response_model=list[str])
def get_prompt(req: RubricEvalRequestModel):
    gg_evaluator: GraniteGuardianRubricEvaluator = get_rubric_evaluator(name=EvaluatorNameEnumOld.GRANITE_GUARDIAN_2B, credentials=req.llm_provider_credentials, provider=ModelProviderEnumOld[req.provider.name])
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
        if req.type == EvaluatorTypeEnum.DIRECT_ASSESSMENT:
            if req.evaluator_name in [EvaluatorNameEnum.GRANITE_GUARDIAN_2B, EvaluatorNameEnum.GRANITE_GUARDIAN_8B]:
                evaluator = get_rubric_evaluator(name=EvaluatorNameEnumOld[req.evaluator_name.name], credentials=req.llm_provider_credentials, provider=ModelProviderEnumOld[req.provider.name])
                res = evaluator.evaluate(contexts=[req.context_variables] * len(req.responses),
                                        responses=req.responses,
                                        criteria=[req.criteria] * len(req.responses),
                                        response_variable_name_list=[req.response_variable_name] * len(req.responses),
                                        check_bias=True)
                print('res')
                print(res)
                for r in res:
                    r['summary'] = r['explanation']
                    del r['explanation']
                return RubricEvalResponseModel(results=res)

            evaluator = DirectAssessmentEvaluator(req.evaluator_name)
            criteria = CriteriaWithOptions(
                name=req.criteria.name,
                description=req.criteria.description,
                options=[CriteriaOption(
                    name=o.name,
                    description=o.description
                ) for o in cast(CriteriaWithOptionsAPI, req.criteria).options]) \
                    if not isinstance(req.criteria, str) else req.criteria
        else:
            evaluator = PairwiseComparisonEvaluator(req.evaluator_name)
            criteria = Criteria(
                name=req.criteria.name,
                description=req.criteria.description) \
                    if not isinstance(req.criteria, str) else req.criteria

        res = evaluator.evaluate(
            contexts=[req.context_variables] * len(req.responses),
            responses=req.responses,
            criteria=criteria,
            # response_variable_name_list=[req.response_variable_name] * len(req.responses),
            credentials=req.llm_provider_credentials,
            provider=req.provider
        )
        if req.type == EvaluatorTypeEnum.DIRECT_ASSESSMENT:
            return RubricEvalResponseModel(results=res)
        else:
            return PairwiseEvalResponseModel(results=res)

    except ValueError as e:
        traceback.print_exc()      
        raise HTTPException(status_code=400, detail=str(e))
    except ApiResponseException as e:
        if e.response.error == "Unauthorized":
            throw_authorized_exception()
        print('raised ApiResponseException')
        traceback.print_exc()      
        raise HTTPException(status_code=400, detail=f"{e.response.error}. {e.response.message}")
    except ApiNetworkException as e:
        # I think the random errors thrown by BAM are of type ApiNetworkException, lets maintain error
        # handling this way till we know better how they are thrown
        print('raised ApiNetworkException')
        traceback.print_exc()   
        raise HTTPException(status_code=500, detail="Something went wrong running the evaluation. Please try again.")
    except ApiRequestFailure as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=e.error_msg)
    except AuthenticationError as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail="Invalid OPENAI credentials provided.")
    except CannotSetProjectOrSpace as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f'watsonx authentication failed: {e.error_msg}')
    except WMLClientError as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f'watsonx authentication failed: {e.error_msg}')
    except AssertionError as e:
        raise HTTPException(status_code=400, detail=f'{e}')
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=e.error_msg if hasattr(e, 'error_msg') else "Unknown error.")

@router.get("/use_case/")
def get_use_cases(user: str):
    use_cases = db.storedusecase.find_many(where={
        'app_user': {
            'email': user
        }
    })
    return use_cases


@router.get("/use_case/{use_case_id}/")
def get_use_case(use_case_id: int, user: str):
    return db.storedusecase.find_unique(where={"id": use_case_id})
    
class PutUseCaseBody(BaseModel):
    user: str
    use_case: StoredUseCase

@router.put("/use_case/")
def put_use_case(request_body: PutUseCaseBody):
    user = db.appuser.find_unique(where={'email': request_body.user})

    found = db.storedusecase.find_unique(where={
        "id": request_body.use_case.id, 
        "user_id": user.id,
    })

    if found:
        res = db.storedusecase.update(
            where={"id": request_body.use_case.id}, 
            data={
                "name": request_body.use_case.name, 
                "content": json.dumps(request_body.use_case.content),
            }
        )

    else:

        name_and_user_exists = db.storedusecase.find_many(
            where={"name":request_body.use_case.name,
                   "user_id": user.id,}
        )

        if name_and_user_exists:
            raise HTTPException(status_code=409, detail=f"The name '{request_body.use_case.name}' is already in use")

        else:
            res = db.storedusecase.create(
                data={
                    "name": request_body.use_case.name, 
                    "content": json.dumps(request_body.use_case.content),
                    "user_id": user.id
                }
            )

    return res
    

class DeleteUseCaseBody(BaseModel):
    use_case_id: int

@router.delete("/use_case/")
def delete_use_case(request_body: DeleteUseCaseBody):
    res = db.storedusecase.delete(where={'id': request_body.use_case_id})
    return res

class CreateUserPostBody(BaseModel):
    email: str
    name: Optional[str] = None

@router.post('/user/')
def create_user_if_not_exist(user: CreateUserPostBody):
    try:
        db_user = db.appuser.find_unique(where={'email': user.email})
        if (db_user is None):
            db_user = db.appuser.create(
                data={
                    'email': user.email, 
                    'name': user.name if user.name is not None else ''
                })
        return db_user
    except PrismaError as pe:
        print(f'Prisma error raised: {pe}')
        return None
    


@router.get("/benchmarks/")
def get_benchmarks():
    # version = pkg_resources.get_distribution("llmasajudge").version
    # print(version)
    json_data = get_all_benchmarks()
    return json_data

app.include_router(router)