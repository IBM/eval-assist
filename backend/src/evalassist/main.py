import logging
import os
import traceback
import uuid
from typing import Optional, Union, cast

import nbformat as nbf
import nest_asyncio
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    FastAPI,
    HTTPException,
    Request,
    status,
)
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlmodel import Session, select
from unitxt.llm_as_judge import (
    DIRECT_CRITERIA,
    PAIRWISE_CRITERIA,
    Criteria,
    CriteriaOption,
    CriteriaWithOptions,
    EvaluatorTypeEnum,
)

# Logging req/resp
from .actions_logger import LoggingRoute
from .api.common import (
    CriteriaAPI,
    CriteriaOptionAPI,
    CriteriaWithOptionsAPI,
    DirectAIActionRequest,
    DirectAIActionResponse,
    DirectEvaluationRequestModel,
    DirectResponseModel,
    FeatureFlagsModel,
    Instance,
    NotebookParams,
    PairwiseEvaluationRequestModel,
    PairwiseResponseModel,
    SyntheticExampleGenerationRequest,
    TestModelRequestModel,
)

# API type definitions
from .api.pipelines import EvaluatorMetadataAPI, EvaluatorsResponseModel
from .api.types import DomainEnum, PersonaEnum
from .benchmark.benchmark import get_all_benchmarks
from .const import (
    AUTHENTICATION_ENABLED,
    EXTENDED_EVALUATORS_METADATA,
    STATIC_DIR,
    STORAGE_ENABLED,
    domain_persona_map,
)
from .database import engine  # Assumes you have engine/session setup
from .evaluators.unitxt import (
    DirectAssessmentEvaluator,
    GraniteGuardianEvaluator,
    PairwiseComparisonEvaluator,
)
from .model import AppUser, StoredTestCase
from .notebook_generation import DirectEvaluationNotebook, PairwiseEvaluationNotebook

# Synthetic
from .synthetic_example_generation.generate import DirectActionGenerator, Generator
from .utils import (
    clean_object,
    get_custom_models,
    get_evaluator_metadata_wrapper,
    get_inference_engine,
    get_model_name_from_evaluator,
    get_system_version,
    handle_llm_generation_exceptions,
    init_evaluator_name,
)

nest_asyncio.apply()
logger = logging.getLogger(__name__)
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def catch_exceptions(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception:
        traceback.print_exc()  # prints full stack trace in console
        raise  # Reraise so FastAPI still returns the 500


router = APIRouter(route_class=LoggingRoute)


def get_session():
    if engine is not None:
        with Session(engine) as session:
            yield session
    else:
        raise HTTPException(
            status_code=400,
            detail=f"The database engine is None, probably because STORAGE_ENABLED is set to false. STORAGE_ENABLED={STORAGE_ENABLED}",
        )


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


@router.get(
    "/feature-flags/",
    response_model=FeatureFlagsModel,
)
def get_feature_flags() -> HealthCheck:
    return {
        "authentication_enabled": AUTHENTICATION_ENABLED,
        "storage_enabled": STORAGE_ENABLED,
    }


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


@router.get("/default-credentials/", response_model=dict[str, dict[str, str]])
def get_default_credentials():
    openai_api_key = os.getenv("EVALASSIST_OPENAI_API_KEY", None)
    azure_api_key = os.getenv("EVALASSIST_AZURE_API_KEY", None)
    azure_api_base = os.getenv("EVALASSIST_AZURE_API_BASE", None)
    rits_api_key = os.getenv("EVALASSIST_RITS_API_KEY", None)
    watsonx_api_key = os.getenv("EVALASSIST_WATSONX_API_KEY", None)
    watsonx_project_id = os.getenv("EVALASSIST_WATSONX_PROJECT_ID", None)
    watsonx_api_base = os.getenv("EVALASSIST_WATSONX_API_BASE", None)
    replicate_api_key = os.getenv("EVALASSIST_REPLICATE_API_KEY", None)
    together_ai_api_key = os.getenv("EVALASSIST_TOGETHER_AI_API_KEY", None)
    bedrock_ai_api_key = os.getenv("EVALASSIST_BEDROCK_AI_API_KEY", None)
    open_ai_like_api_key = os.getenv("EVALASSIST_OPEN_AI_LIKE_API_KEY", None)
    open_ai_like_api_base = os.getenv("EVALASSIST_OPEN_AI_LIKE_API_BASE", None)
    ollama_api_key = os.getenv("EVALASSIST_OLLAMA_API_BASE", None)
    vertex_ai_api_key = os.getenv("EVALASSIST_VERTEX_AI_API_KEY", None)

    res = clean_object(
        {
            "rits": {"api_key": rits_api_key},
            "watsonx": {
                "api_key": watsonx_api_key,
                "project_id": watsonx_project_id,
                "api_base": watsonx_api_base,
            },
            "open-ai": {"api_key": openai_api_key},
            "replicate": {"api_key": replicate_api_key},
            "azure": {"api_key": azure_api_key, "api_base": azure_api_base},
            "together-ai": {"api_key": together_ai_api_key},
            "vertex-ai": {"api_key": vertex_ai_api_key},
            "bedrock": {"api_key": bedrock_ai_api_key},
            "open-ai-like": {
                "api_key": open_ai_like_api_key,
                "api_base": open_ai_like_api_base,
            },
            "ollama": {"api_base": ollama_api_key},
        }
    )
    return res


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
                prediction_field=c.prediction_field,
                context_fields=c.context_fields,
            )
            for c in DIRECT_CRITERIA
        ],
        "pairwise": [
            CriteriaAPI(
                name=c.name,
                description=c.description,
                prediction_field=c.prediction_field,
                context_fields=c.context_fields,
            )
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


@router.post("/test-model/")
async def test_model(req: TestModelRequestModel):
    evaluator_name, custom_model_name = init_evaluator_name(req.evaluator_name)
    model_name = get_model_name_from_evaluator(
        get_evaluator_metadata_wrapper(evaluator_name, custom_model_name),
        req.provider,
    )
    inference_engine = get_inference_engine(
        req.llm_provider_credentials,
        req.provider,
        model_name,
        custom_params={"max_tokens": 1, "use_cache": False},
    )
    try:
        inference_engine.infer([{"source": "Ok?"}])[0]
        return HealthCheck(status="OK")
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=400,
            detail="Model test failed. Please check your credentials or model name.",
        )


@router.post(
    "/evaluate/", response_model=Union[DirectResponseModel, PairwiseResponseModel]
)
async def evaluate(req: DirectEvaluationRequestModel | PairwiseEvaluationRequestModel):
    evaluator_name, custom_model_name = init_evaluator_name(req.evaluator_name)

    @handle_llm_generation_exceptions
    def run():
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
            credentials=req.llm_provider_credentials,
            provider=req.provider,
        )
        if req.type == EvaluatorTypeEnum.DIRECT:
            return DirectResponseModel(results=res)
        else:
            return PairwiseResponseModel(results=res)

    return run()


@router.get("/test_case/")
def get_test_cases(user: str, session: Session = Depends(get_session)):
    statement = select(StoredTestCase).join(AppUser).where(AppUser.email == user)
    test_cases = session.exec(statement).all()
    return test_cases


# used to log varying user actions
@router.post("/log_user_action/")
def log_user_action():
    pass


@router.get("/test_case/{test_case_id}/")
def get_test_case(
    test_case_id: int, user: str, session: Session = Depends(get_session)
):
    statement = select(StoredTestCase).where(StoredTestCase.id == test_case_id)
    test_case = session.exec(statement).first()
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    return test_case


class PutTestCaseBody(BaseModel):
    user: str
    test_case: StoredTestCase


# from .schemas import PutTestCaseBody  # Make sure this is defined


@router.put("/test_case/")
def put_test_case(
    request_body: PutTestCaseBody, session: Session = Depends(get_session)
):
    # Find user by email
    user = session.exec(
        select(AppUser).where(AppUser.email == request_body.user)
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Try to find the test case by id and user_id
    found = session.exec(
        select(StoredTestCase).where(
            (StoredTestCase.id == request_body.test_case.id)
            & (StoredTestCase.user_id == user.id)
        )
    ).first()

    if found:
        found.name = request_body.test_case.name
        found.content = request_body.test_case.content
        session.add(found)
        session.commit()
        session.refresh(found)
        return found
    else:
        # Check if name is already used by this user
        name_and_user_exists = session.exec(
            select(StoredTestCase).where(
                (StoredTestCase.name == request_body.test_case.name)
                & (StoredTestCase.user_id == user.id)
            )
        ).first()

        if name_and_user_exists:
            raise HTTPException(
                status_code=409,
                detail=f"The name '{request_body.test_case.name}' is already in use",
            )
        else:
            new_case = StoredTestCase(
                name=request_body.test_case.name,
                content=request_body.test_case.content,
                user_id=user.id,
            )
            session.add(new_case)
            session.commit()
            session.refresh(new_case)
            return new_case


class DeleteTestCaseBody(BaseModel):
    test_case_id: int


@router.delete("/test_case/")
@router.delete("/test_case/")
def delete_test_case(
    request_body: DeleteTestCaseBody, session: Session = Depends(get_session)
):
    test_case = session.get(StoredTestCase, request_body.test_case_id)
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    session.delete(test_case)
    session.commit()
    return {"ok": True}


class CreateUserPostBody(BaseModel):
    email: str
    name: Optional[str] = None


@router.post("/user/")
def create_user_if_not_exist(
    user: CreateUserPostBody, session: Session = Depends(get_session)
):
    db_user = session.exec(select(AppUser).where(AppUser.email == user.email)).first()
    logger.debug(f"Found user:\n{db_user}")
    if db_user is None:
        db_user = AppUser(
            email=user.email,
            name=user.name if user.name is not None else "",
        )
        session.add(db_user)
        session.commit()
        session.refresh(db_user)
        logger.debug(f"User not found. Created user:\n{db_user}")
    return db_user


@router.get("/benchmarks/")
def get_benchmarks():
    benchmarks_results = get_all_benchmarks()
    fetched_results = []
    for benchmark_name, benchmark_data in benchmarks_results.items():
        fetched_criteria_benchmarks = []
        for criteria_name, criteria_benchmark_data in benchmark_data[
            "criteria_benchmarks"
        ].items():
            criteria_benchmark_data["evaluator_benchmarks"] = list(
                criteria_benchmark_data["evaluator_benchmarks"].values()
            )
            fetched_criteria_benchmarks.append(criteria_benchmark_data)
        benchmark_data["criteria_benchmarks"] = list(
            benchmark_data["criteria_benchmarks"].values()
        )
        fetched_results.append(benchmark_data)

    return fetched_results


def cleanup_file(filepath: str):
    """Safely remove a file after it has been served."""
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


@router.get(
    "/domains-and-personas/", response_model=dict[DomainEnum, list[PersonaEnum]]
)
def get_domain_persona_map():
    return domain_persona_map


@router.post("/direct-ai-action/", response_model=DirectAIActionResponse)
def perform_direct_ai_action(params: DirectAIActionRequest):
    evaluator_name, custom_model_name = init_evaluator_name(params.evaluator_name)

    # initialize generator and generate response
    @handle_llm_generation_exceptions
    def run():
        direct_action_generator = DirectActionGenerator(
            evaluator_name=evaluator_name,
            custom_model_name=custom_model_name,
            provider=params.provider,
            llm_provider_credentials=params.llm_provider_credentials,
            type=params.type,
            action=params.action,
            prompt=params.prompt,
        )
        return DirectAIActionResponse(result=direct_action_generator.generate(params))

    return run()


@router.post("/synthetic-examples/", response_model=list[Instance])
def get_synthetic_examples(params: SyntheticExampleGenerationRequest):
    # populate config
    evaluator_name, custom_model_name = init_evaluator_name(params.evaluator_name)

    # initialize generator and generate response
    @handle_llm_generation_exceptions
    def run():
        generator = Generator(
            evaluator_name=evaluator_name,
            custom_model_name=custom_model_name,
            provider=params.provider,
            llm_provider_credentials=params.llm_provider_credentials,
            type=params.type,
            criteria=params.criteria,
            response_variable_name=params.response_variable_name,
            context_variables_names=params.context_variables_names,
            generation_length=params.generation_length,
            task=params.task,
            domain=params.domain,
            persona=params.persona,
            per_criteria_option_count=params.per_criteria_option_count,
            borderline_count=params.borderline_count,
        )
        return generator.generate()

    return run()


@router.get("/version/")
def get_version():
    """Retrieves the system version

    Git version is given priority, thus if git is installed
    in the system and a .git folder is present, the output
    of 'git describe' is returned. If that fails, the package
    version is returned. If that fails too, the string 'not
    available' is returned instead.

    Returns:
        an object with version and source fields
    """
    return get_system_version()


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    exc_str = f"{exc}".replace("\n", " ").replace("   ", " ")
    logging.error(f"{request}: {exc_str}")
    content = {"status_code": 10422, "message": exc_str, "data": None}
    return JSONResponse(
        content=content, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
    )


app.include_router(router, prefix="/api")

if os.path.exists(STATIC_DIR):
    logger.debug(f"Serving static files from {STATIC_DIR}")
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
