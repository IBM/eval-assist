from typing import List
from prisma.models import LLMModel, Prompt
from prisma.enums import ModelRunStatus
from .genai_client import client
from .db_client import db
from genai.schema import TextGenerationParameters
import logging
import datetime
import time

def get_models_from_api() -> List[LLMModel]: 
    models_response = client.model.list().results
    ibm_models = [m for m in models_response if m.is_live and m.id.startswith('ibm') ]
    non_ibm_models = [m for m in models_response if m.is_live and not m.id.startswith('ibm') ]
    ibm_models.sort(key=lambda x: x.name)
    non_ibm_models.sort(key=lambda x: x.name)
    models = [*ibm_models, *non_ibm_models]
    generation_models = [m for m in models if "generation" in m.task_ids]
    response = [LLMModel(id=m.id, name=m.name) for m in generation_models]
    return response

def get_models_from_db() -> List[LLMModel]: 
    return db.llmmodel.find_many()

def get_default_model():
    return db.llmmodel.find_unique(where={
        'id': "meta-llama/llama-2-70b-chat"
    })


async def sync_db_models():
    sync_models_entry_exists = db.modelssync.count() == 1
    should_sync = True

    if (sync_models_entry_exists):
        updated_at = db.modelssync.find_unique(where= {"id": 1}).updated_at.replace(tzinfo=None)
        now = datetime.datetime.now(tz=None)
        seconds_difference = (now - updated_at).total_seconds()
        should_sync = seconds_difference > 86400
        if not should_sync:
            print(f'Not syncying llm models with BAM ({24 - round(seconds_difference / 60 / 60)} hours left to sync)')

    else: 
        db.modelssync.create(data={"id": 1, "updated_at": datetime.datetime.now()})

    if should_sync:
        print('Syncying llm models with BAM')
        models = get_models_from_api()
        for model in models:
            db.llmmodel.upsert(
                where={
                    "id": model.id
                },
                data={
                    "create": {                    
                        "name": model.name,
                        "id": model.id
                    },
                    "update": {   
                    },
                })

        #remove models that are no longer available
        db.llmmodel.delete_many(
            where= {
                "id": {
                    "notIn": [m.id for m in models]
                }
            }
        )    

        db.modelssync.update(where={'id': 1}, data={"updated_at": datetime.datetime.now(tz=None)})


def run_model(prompt: Prompt):

    try:
        params = TextGenerationParameters(
                decoding_method="greedy",
                max_new_tokens=300,
                min_new_tokens=10,
            )
        
        start = time.time()
        print(f'Generating text for prompt {prompt.id}')
        responses = list(
                        client.text.generation.create(
                            model_id=prompt.model.id,
                            inputs=[prompt.text],
                            parameters=params
                        )
                    )
        end = time.time()
        print(f'Text generation for prompt {prompt.id} took {end - start} ({prompt.llm_model_id})')
        generated_text = responses[0].results[0].generated_text.strip()
        db.prompt.update(where={'id': prompt.id}, 
                         data={'output': generated_text, 'status': ModelRunStatus.FINISHED, 
                               'last_generated_text_prompt': prompt.text,
                               'last_generated_text_model_id': prompt.llm_model_id})

    except Exception as e:
        db.prompt.update(where={'id': prompt.id}, data={'status': ModelRunStatus.FAILED})
        print(f'Error running model {prompt.llm_model_id} for prompt {prompt.id}')
        print(e.with_traceback()) 
        
        