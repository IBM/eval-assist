from io import StringIO
from fastapi import FastAPI, status, UploadFile, HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv

from .utils import log_runtime
from .db_client import db
from .genai_client import client
from datetime import datetime
load_dotenv()
import pandas as pd 
from time import sleep
import json
from genai import Credentials, Client
from src.evaluators import RubricEvaluator, Rubric, RubricOption


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gen ai client
credentials = Credentials.from_env()
app.client = Client(credentials=credentials)

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


class RubricOptionModel(BaseModel):
    option: str
    description: str

class RubricModel(BaseModel):
    criteria: str
    options: List[RubricOptionModel]

class EvalRequestModel(BaseModel):
    context: str
    response: str
    rubric: RubricModel

class EvalResponseModel(BaseModel):
    option: str
    explanation: str
    p_bias: bool

@app.post("/evaluate/", response_model=EvalResponseModel)
async def evaluate(evalRequest: EvalRequestModel):
    evaluator = RubricEvaluator(client=app.client)
    rubric = Rubric.from_json(evalRequest.rubric.model_dump_json())

    try:
        return evaluator.evaluate("mistralai/mixtral-8x7b-instruct-v0-1", 
                                evalRequest.context, 
                                evalRequest.response, 
                                rubric)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
