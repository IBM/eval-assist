from fastapi import HTTPException
from pydantic import BaseModel, validator
from unitxt.eval_assist_constants import EvaluatorTypeEnum, EvaluatorNameEnum, ModelProviderEnum
class CriteriaModel(BaseModel):
    name: str
    description: str

    @validator('description', pre=True, always=True)
    def validate_criteria(cls, description):
        if len(description.strip()) == 0:
            raise HTTPException(status_code=400, detail="Evaluation criteria is required.")
        return description

class EvalRequestModel(BaseModel):
    context_variables: dict[str, str]
    responses: list[str]
    provider: ModelProviderEnum
    llm_provider_credentials: dict[str,str]
    evaluator_name: EvaluatorNameEnum
    type: EvaluatorTypeEnum

    @validator('llm_provider_credentials', pre=True, always=True)
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

    @validator('evaluator_name', pre=True, always=True)
    def validate_pipeline(cls, evaluator_name):
        if not evaluator_name:
            raise HTTPException(status_code=400, detail="A valid pipeline name is required.")
        return evaluator_name

