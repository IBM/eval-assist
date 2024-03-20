from fastapi import FastAPI, BackgroundTasks, status
from pydantic import BaseModel
from genai import Credentials, Client
import os
from evaluation import run_evaluation, clean_evaluation_state
from db_client import db

# uncomment to disable requests logging
# import logging
# logging.getLogger('uvicorn.access').setLevel(logging.WARNING)

app = FastAPI()
BAM_API_KEY = os.getenv("GENAI_KEY", None)
BAM_API_URL = os.getenv("GENAI_API", None)
client = Client(credentials=Credentials(api_key=BAM_API_KEY, api_endpoint=BAM_API_URL))

class HealthCheck(BaseModel):
    status: str = "OK"

class PostRunRequest(BaseModel):
    evaluation_id: int

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


@app.post("/runs")
async def post_run(req: PostRunRequest, background_tasks: BackgroundTasks):
 
    evaluation = db.evaluation.find_unique(
        where={
        'id': req.evaluation_id,
    })

    # The run object for tracking
    # TODO: Error handling

    run = db.run.create({
        'name': evaluation.name + "_run",
        'state': 'running',
        'evaluationId': evaluation.id
    })

    background_tasks.add_task(run_evaluation, req.evaluation_id)
    return run

@app.get("/runs/{id}")
async def get_run(id: int):
    return db.run.find_unique(
        where={
        'id': id,
    })

@app.get("/models")
async def get_models():
    models_response = client.model.list().results
    ibm_models = [m for m in models_response if m.is_live and m.id.startswith('ibm') ]
    non_ibm_models = [m for m in models_response if m.is_live and not m.id.startswith('ibm') ]
    ibm_models.sort(key=lambda x: x.name)
    non_ibm_models.sort(key=lambda x: x.name)
    models = [*ibm_models, *non_ibm_models]
    models = [{'id': m.id, 'name': m.name} for m in models]
    return models

@app.post("/cancel_evaluation")
async def cancel_evaluation(req: PostRunRequest, background_tasks: BackgroundTasks):
    clean_evaluation_state(req.evaluation_id)
    return 'Ok'

@app.on_event("shutdown")    
async def app_shutdown():
    db.disconnect()

