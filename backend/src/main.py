import traceback
from typing import Optional, Union
from fastapi import FastAPI, status, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, RootModel

from .api.pairwise import PairwiseEvalRequestModel, PairwiseEvalResponseModel
from .api.rubric import RubricEvalRequestModel, RubricEvalResponseModel

from .db_client import db
import json
from prisma.models import StoredUseCase
from prisma.errors import PrismaError
from llmasajudge.evaluators import get_rubric_evaluator, get_all_vs_all_pairwise_evaluator, available_evaluators, EvaluatorTypeEnum, PairwiseCriteria, RubricCriteria, Evaluator
from llmasajudge.benchmark.utils import get_all_benchmarks
from genai.exceptions import ApiResponseException, ApiNetworkException
from ibm_watsonx_ai.wml_client_error import ApiRequestFailure
import json

# API type definitions
from .api.pipelines import PipelinesResponseModel

# Logging req/resp
from .logger import LoggingRoute

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

'''
Get the list of available pipelines, as supported by llm-as-a-judge library
'''
@router.get("/pipelines/", response_model=PipelinesResponseModel)
def get_pipelines():
    available_pipelines = [e.metadata for e in available_evaluators]
    return PipelinesResponseModel(pipelines=available_pipelines)



'''
Single evaluation endpoint
TODO: Update endpoint path 
'''
@router.post("/evaluate/", response_model=Union[RubricEvalResponseModel, PairwiseEvalResponseModel])
def evaluate(req: Union[RubricEvalRequestModel, PairwiseEvalRequestModel]):
    # Gen ai client
    try:
        if req.type == EvaluatorTypeEnum.RUBRIC:
            evaluator = get_rubric_evaluator(name=req.pipeline, credentials=req.model_provider_credentials)
            criteria = RubricCriteria(name=req.criteria.name, criteria=req.criteria.criteria, options=req.criteria.options)

            res = evaluator.evaluate(contexts=[req.context_variables] * len(req.responses), 
                                    responses=req.responses, 
                                    criteria=criteria,
                                    check_bias=True)
            return RubricEvalResponseModel(results=res)
        elif req.type == EvaluatorTypeEnum.ALL_V_ALL_PAIRWISE:
            evaluator = get_all_vs_all_pairwise_evaluator(name=req.pipeline, credentials=req.model_provider_credentials)
            criteria = PairwiseCriteria(name=req.criteria.name, criteria=req.criteria.criteria)
            [per_response_results, ranking] = evaluator.evaluate(
                                context_variables=req.context_variables, 
                                responses=req.responses, 
                                criteria=criteria,
                                check_bias=True)
            return PairwiseEvalResponseModel(per_response_results=per_response_results, ranking=ranking)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ApiResponseException as e:
        if e.response.error == "Unauthorized":
            throw_authorized_exception()
        print('raised ApiResponseException')
        print(e.response.error)
        raise HTTPException(status_code=400, detail="Something went wrong running the evaluation. Please try again.")
    except ApiNetworkException as e:
        # I think the random errors thrown by BAM are of type ApiNetworkException, lets maintain error
        # handling this way till we know better how they are thrown
        print('raised ApiNetworkException')
        traceback.print_exc()      
        raise HTTPException(status_code=500, detail="Something went wrong running the evaluation. Please try again.")
    except ApiRequestFailure as e:
        traceback.print_exc()      
        raise HTTPException(status_code=400, detail="e.error_msg")

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