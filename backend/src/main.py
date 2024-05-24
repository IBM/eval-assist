from io import StringIO
from fastapi import FastAPI, status, UploadFile, HTTPException, APIRouter
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .utils import log_runtime
from .db_client import db
from datetime import datetime
import pandas as pd 
import json
from genai import Credentials, Client
from prisma.models import StoredUseCase
from prisma.errors import PrismaError
from llmasajudge.evaluators import RubricCriteria, PairwiseCriteria
from llmasajudge.evaluators import MixtralRubricEvaluator, Llama3InstructRubricEvaluator
from llmasajudge.evaluators import MixtralPairwiseEvaluator, Llama3InstructPairwiseEvaluator
from llmasajudge.evaluators import PrometheusPairwiseEvaluator, PrometheusRubricEvaluator
from genai.exceptions import ApiResponseException, ApiNetworkException
import os
import json

# API type definitions
from  .api.pipelines import PipelinesResponseModel, PipelineModel, PAIRWISE_TYPE, RUBRIC_TYPE
from  .api.pairwise import PairwiseEvalRequestModel, PairwiseEvalResponseModel
from  .api.rubric import RubricEvalRequestModel, RubricEvalResponseModel

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

@app.get(
    "/health",
    tags=["healthcheck"],
    summary="Perform a Health Check",
    response_description="Return HTTP Status Code 200 (OK)",
    status_code=status.HTTP_200_OK,
    response_model=HealthCheck,
)
def get_health() -> HealthCheck:
    return HealthCheck(status="OK")


'''
Evaluation endpoints
'''

@app.get("/evaluation/")
async def get_evaluations():
    evaluations = db.evaluation.find_many(where={'deleted': False})
    return evaluations

@app.post("/evaluation/")
async def create_evaluation(post_exp: PostEvaluationBody):
    evaluation = db.evaluation.create(data=jsonable_encoder(post_exp))
    
    return evaluation

@app.get("/evaluation/{id}/")
async def get_evaluation(id: int):
    return db.evaluation.find_unique(
        where={'id': id}, 
    )

@app.delete("/evaluation/{id}/")
async def delete_evaluations(id: int):
    return db.evaluation.update(
        where =
        {
            'id': id,
        },
        data = {
            'deleted': True,
            'deleted_at': datetime.now()
        }
    )

def validate_data(df: pd.DataFrame, context_columns, df_colums_stripped):
    required_columns = ['config', 'model_output']
    missing_columns = set(required_columns) - set(df_colums_stripped)

    if len(missing_columns) > 0:
        raise HTTPException(status_code=400, detail=f'Missing required columns. Please make sure to include {missing_columns}.' )
    if df.shape[0] == 0:
        raise HTTPException(status_code=400, detail=f'There were no rows found in the csv file.' )
    if len(context_columns) == 0:
        raise HTTPException(status_code=400, detail=f'No context columns were found in the csv file.' )
    
@log_runtime
def store_datums(groups, context_columns, evaluation_id):
    datums_to_create = []
    for name, group in groups:
        # name: a tuple with the grouped by values
        # group: a df that only includes the rows where grouped by columns == name tuple
        context_json = {context_columns[i]:name[i] for i in range(len(context_columns))}
        # datum = db.datum.create(data={'context': json.dumps(context_json)})
        datums_to_create.append({'context': json.dumps(context_json), 'evaluation_id': evaluation_id})
    
    created_datums_count = db.datum.create_many(datums_to_create)
    print(f"Created {created_datums_count} datums")
    return created_datums_count

@log_runtime
def store_model_outputs(groups, evaluation_id):
    # Create and store the model outputs
    # Get all the datums for the current evaluation in order to get their ids
    created_datums = db.datum.find_many(where={'evaluation_id': evaluation_id})
    model_outputs_to_create = []
    for name, group in groups:
        # Get the datum from the datum list for the current group
        # there may be a more efficient way to do this. For each group we are searching for all the datums
        # The important aspect is not to access the DB again
        datum = next(x for x in created_datums if all(x.context[k] == group[k].tolist()[0] for k in x.context))
        for index, row in group.iterrows():
            model_output = {
                'evaluation_id': evaluation_id,
                'datum_id': datum.id,
                'config': row.loc['config'],
                'text': row.loc['model_output'],
            }
            model_outputs_to_create.append(model_output)
    
    created_model_outputs_count = db.modeloutput.create_many(model_outputs_to_create)
    print(f"Created {created_model_outputs_count} datums")
    return created_model_outputs_count

@app.post("/evaluation/{evaluation_id}/upload_data/")
async def upload_data(evaluation_id: int, file: UploadFile):
    try:
        csv_data = StringIO(file.file.read().decode("utf-8"))
        df = pd.read_csv(csv_data)
    except:
        raise HTTPException(status_code=400, detail=f'Something went wrong processing the file.')
    df_colums_stripped = [c.strip() for c in df.columns ]
    context_columns = [c for c in df_colums_stripped if c.startswith('context_')]
    validate_data(df, context_columns, df_colums_stripped)

    # Create and store the datums by grouping bt the context columns
    groups = df.groupby(context_columns)

    created_datums_count = store_datums(groups, context_columns, evaluation_id)
    created_model_outputs_count = store_model_outputs(groups, evaluation_id)
    
    res =  {
        'created_datums_count': created_datums_count, 
        'created_model_outputs_count': created_model_outputs_count
        }

    return res

@app.on_event("shutdown")    
async def app_shutdown():
    db.disconnect()

def throw_authorized_exception():
    raise HTTPException(status_code=401, detail=f"Couldn't connect to BAM. Please check that the provided API key is correct." )

def throw_unknown_pipeline_exception():
    raise HTTPException(status_code=401, detail=f"Unknown evaluation pipeline." )

# Map API pipeline names to library instantiations
# TODO: This should be moved to library
name_to_pipeline = {
    RUBRIC_TYPE: {
        "mistralai/mixtral-8x7b-instruct-v01": lambda client : MixtralRubricEvaluator(client=client),
        "meta-llama/llama-3-8b-instruct": lambda client : Llama3InstructRubricEvaluator(client=client, model_id="meta-llama/llama-3-8b-instruct"),
        "meta-llama/llama-3-70b-instruct": lambda client : Llama3InstructRubricEvaluator(client=client, model_id="meta-llama/llama-3-70b-instruct"),
        "kaist-ai/prometheus-8x7b-v2": lambda client : PrometheusRubricEvaluator(client=client),
    },
    PAIRWISE_TYPE: {
        "mistralai/mixtral-8x7b-instruct-v01": lambda client : MixtralPairwiseEvaluator(client=client),
        "meta-llama/llama-3-8b-instruct": lambda client : Llama3InstructPairwiseEvaluator(client=client, model_id="meta-llama/llama-3-8b-instruct"),
        "meta-llama/llama-3-70b-instruct": lambda client : Llama3InstructPairwiseEvaluator(client=client, model_id="meta-llama/llama-3-70b-instruct"),
        "kaist-ai/prometheus-8x7b-v2": lambda client : PrometheusPairwiseEvaluator(client=client),
    }
}

def is_pipeline_valid(pipeline: str, type: str):
    return pipeline in name_to_pipeline[type]

def get_pipeline(type: str, pipeline: str, client: Client):
    return name_to_pipeline[type][pipeline](client=client)

'''
Get the list of available pipelines, as supported by llm-as-a-judge library
'''
@app.get("/pipelines/", response_model=PipelinesResponseModel)
async def get_pipelines():
    available_pipelines = []
    for type, pipelines in name_to_pipeline.items():
        for pipeline_name in pipelines.keys():
            available_pipelines.append(PipelineModel(name=pipeline_name, type=type))
    return PipelinesResponseModel(pipelines=available_pipelines)

'''
Single pairwise evaluation endpoint
'''
@router.post("/evaluate/pairwise/", response_model=PairwiseEvalResponseModel)
async def evaluate(req: PairwiseEvalRequestModel):

    BAM_API_URL = os.getenv("GENAI_API", None)  
    credentials = Credentials(api_key=req.bam_api_key, api_endpoint=BAM_API_URL)
    client = Client(credentials=credentials)

    if not is_pipeline_valid(pipeline=req.pipeline, type=PAIRWISE_TYPE):
        throw_unknown_pipeline_exception()
    
    evaluator = get_pipeline(type=PAIRWISE_TYPE, pipeline=req.pipeline, client=client)
    criteria = PairwiseCriteria.from_json(req.criteria.model_dump_json())

    try:
        res = evaluator.evaluate(instructions=[req.instruction], 
                                responses=[req.responses], 
                                criteria=criteria)
        return PairwiseEvalResponseModel(results=res)
    except ApiResponseException as e:
        if e.response.error == "Unauthorized":
            throw_authorized_exception()
        print('raised ApiResponseException')
        print(e.response.error)
        raise HTTPException(status_code=500, detail="Something went wrong running the evaluation. Please try again.")
    except ApiNetworkException as e:
        # I think the random errors thrown by BAM are of type ApiNetworkException, lets maintain error
        # handling this way till we know better how they are thrown
        print('raised ApiNetworkException')
        print(e.response.error)
        raise HTTPException(status_code=500, detail="Something went wrong running the evaluation. Please try again.")

'''
Single rubric evaluation endpoint
TODO: Update endpoint path 
'''
@router.post("/evaluate/rubric/", response_model=RubricEvalResponseModel)
async def evaluate(req: RubricEvalRequestModel):
    # Gen ai client
    BAM_API_URL = os.getenv("GENAI_API", None)  
    credentials = Credentials(api_key=req.bam_api_key, api_endpoint=BAM_API_URL)
    client = Client(credentials=credentials)

    if not is_pipeline_valid(pipeline=req.pipeline, type=PAIRWISE_TYPE):
        throw_unknown_pipeline_exception()

    evaluator = get_pipeline(type=RUBRIC_TYPE, pipeline=req.pipeline, client=client)
    criteria = RubricCriteria.from_json(req.rubric.model_dump_json())

    try:
        res = evaluator.evaluate(contexts=[req.context]*len(req.responses), 
                                responses=req.responses, 
                                rubric=criteria)
        return RubricEvalResponseModel(results=res)
    except ApiResponseException as e:
        if e.response.error == "Unauthorized":
            throw_authorized_exception()
        print('raised ApiResponseException')
        print(e.response.error)
        raise HTTPException(status_code=500, detail="Something went wrong running the evaluation. Please try again.")
    except ApiNetworkException as e:
        # I think the random errors thrown by BAM are of type ApiNetworkException, lets maintain error
        # handling this way till we know better how they are thrown
        print('raised ApiNetworkException')
        print(e.response.error)
        raise HTTPException(status_code=500, detail="Something went wrong running the evaluation. Please try again.")


@router.get("/use_case/")
async def get_use_cases(user: str):
    use_cases = db.storedusecase.find_many(where={
        'app_user': {
            'email': user
        }
    })
    return use_cases


@router.get("/use_case/{use_case_id}/")
async def get_use_case(use_case_id: int, user: str):
    return db.storedusecase.find_unique(where={"id": use_case_id})
    
class PutUseCaseBody(BaseModel):
    user: str
    use_case: StoredUseCase

@router.put("/use_case/")
async def put_use_case(request_body: PutUseCaseBody):
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
async def delete_use_case(request_body: DeleteUseCaseBody):
    res = db.storedusecase.delete(where={'id': request_body.use_case_id})
    return res

class CreateUserPostBody(BaseModel):
    email: str
    name: str

@app.post('/user/')
async def create_user_if_not_exist(user:CreateUserPostBody):
    try:
        db_user = db.appuser.find_unique(where={'email': user.email})
        if (db_user is None):
            db_user = db.appuser.create(data={'email': user.email, 'name': user.name})
        return db_user
    except PrismaError as pe:
        print(f'Prisma error raised: {pe}')
        return None
    

app.include_router(router)