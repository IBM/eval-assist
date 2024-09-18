from fastapi import HTTPException
from pydantic import BaseModel, validator
from llmasajudge.evaluators import EvaluatorTypeEnum

class CriteriaModel(BaseModel):
    name: str
    criteria: str

    @validator('criteria', pre=True, always=True)
    def validate_criteria(cls, criteria):
        if len(criteria.strip()) == 0:
            raise HTTPException(status_code=400, detail="Evaluation criteria is required.")
        return criteria

class EvalRequestModel(BaseModel):
    context_variables: dict[str, str]
    responses: list[str]
    model_provider_credentials: dict[str,str]
    pipeline: str
    type: EvaluatorTypeEnum

    @validator('model_provider_credentials', pre=True, always=True)
    def validate_api_key(cls, key):
        if not key:
            raise HTTPException(status_code=400, detail="API credentials are required.")
        return key

    
    @validator('context_variables', pre=True, always=True)
    def validate_context_variables_key(cls, context_variables):
        for context_variable_name in context_variables.keys():
            if context_variable_name == "":
                raise HTTPException(status_code=400, detail="Context variable names can't be empty.")
        return context_variables

    @validator('pipeline', pre=True, always=True)
    def validate_pipeline(cls, pipeline):
        if not pipeline:
            raise HTTPException(status_code=400, detail="A valid pipeline name is required.")
        return pipeline

