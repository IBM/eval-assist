import logging
import os
from pathlib import Path

from .api_types import DomainEnum, GenerationLengthEnum, PersonaEnum

logger = logging.getLogger(__name__)

domain_persona_map = {
    DomainEnum.NEWS_MEDIA_DOMAIN: [
        PersonaEnum.EXPERIENCED_JOURNALIST,
        PersonaEnum.NOVICE_JOURNALIST,
        PersonaEnum.OPINION_COLUMNIST,
        PersonaEnum.NEWS_ANCHOR,
        PersonaEnum.EDITOR,
    ],
    DomainEnum.HEALTHCARE: [
        PersonaEnum.MEDICAL_RESEARCHER,
        PersonaEnum.GENERAL_PRACTITIONER,
        PersonaEnum.PUBLIC_HEALTH_OFFICIAL,
        PersonaEnum.HEALTH_BLOGGER,
        PersonaEnum.MEDICAL_STUDENT,
    ],
    DomainEnum.ENTERTAINMENT_AND_POP_CULTURE: [
        PersonaEnum.FILM_CRITIC,
        PersonaEnum.CASUAL_SOCIAL_MEDIA_USER,
        PersonaEnum.TABLOID_REPORTER,
        PersonaEnum.HARDCORE_FAN_THEORIST,
        PersonaEnum.INFLUENCER_YOUTUBE_REVIEWER,
    ],
    DomainEnum.SOCIAL_MEDIA: [
        PersonaEnum.INFLUENCER_POSITIVE_BRAND,
        PersonaEnum.INTERNET_TROLL,
        PersonaEnum.POLITICAL_ACTIVIST,
        PersonaEnum.BRAND_VOICE,
        PersonaEnum.MEMER,
    ],
    DomainEnum.CUSTOMER_SUPPORT_AND_BUSSINESS: [
        PersonaEnum.CUSTOMER_SERVICE_AGENT,
        PersonaEnum.ANGRY_CUSTOMER,
        PersonaEnum.CORPORATE_CEO,
        PersonaEnum.CONSUMER_ADVOCATE,
        PersonaEnum.MAKETING_SPECIALIST,
    ],
    DomainEnum.GAMING_AND_ENTERTAINMENT: [
        PersonaEnum.FLAMER,
        PersonaEnum.HARDCORE_GAMER,
        PersonaEnum.ESPORT_COMENTATOR,
        PersonaEnum.MOVIE_CRITIC,
        PersonaEnum.FAN,
    ],
}

generation_length_to_sentence_count = {
    GenerationLengthEnum.SHORT: "1-2 sentences",
    GenerationLengthEnum.MEDIUM: "3-5 sentences",
    GenerationLengthEnum.LONG: "5-9 sentences",
}


EVAL_ASSIST_DIR = Path(__file__).parent
STATIC_DIR = Path(os.getenv("STATIC_DIR", EVAL_ASSIST_DIR / "static"))
DATA_DIR = Path(os.getenv("DATA_DIR", EVAL_ASSIST_DIR / "data")).expanduser()
DATA_DIR.mkdir(parents=True, exist_ok=True)
DEFAULT_DATABASE_URL = f"sqlite:////{DATA_DIR / 'evalassist.db'}"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)
TEMPORARY_FILES_FOLDER = EVAL_ASSIST_DIR / "temporary_files"
TEMPORARY_FILES_FOLDER.mkdir(parents=True, exist_ok=True)

DEFAULT_UNITXT_INFERENCE_ENGINE_CACHE_PATH = DATA_DIR / "inference_engine_cache"

UNITXT_INFERENCE_ENGINE_CACHE_PATH = os.getenv("UNITXT_INFERENCE_ENGINE_CACHE_PATH")
if UNITXT_INFERENCE_ENGINE_CACHE_PATH is None:
    UNITXT_INFERENCE_ENGINE_CACHE_PATH = DEFAULT_UNITXT_INFERENCE_ENGINE_CACHE_PATH
    os.environ["UNITXT_INFERENCE_ENGINE_CACHE_PATH"] = str(
        DEFAULT_UNITXT_INFERENCE_ENGINE_CACHE_PATH
    )
else:
    UNITXT_INFERENCE_ENGINE_CACHE_PATH = Path(UNITXT_INFERENCE_ENGINE_CACHE_PATH)
UNITXT_INFERENCE_ENGINE_CACHE_PATH.mkdir(parents=True, exist_ok=True)

UNITXT_CACHE_ENABLED = os.getenv("UNITXT_CACHE_ENABLED", "true").lower() == "true"
STORAGE_ENABLED = os.getenv("STORAGE_ENABLED", "true").lower() == "true"
os.environ["STORAGE_ENABLED"] = str(STORAGE_ENABLED)

AUTHENTICATION_ENABLED = os.getenv("AUTHENTICATION_ENABLED", "false").lower() == "true"

UVICORN_WORKERS = os.getenv("UVICORN_WORKERS", "1")
try:
    UVICORN_WORKERS = int(UVICORN_WORKERS)
    if UVICORN_WORKERS < 1:
        UVICORN_WORKERS = 1
except ValueError:
    UVICORN_WORKERS = 1
    logger.info(f"Invalid UVICORN_WORKERS value, defaulting to {UVICORN_WORKERS}")

CUSTOM_MODELS_PATH = os.getenv(
    "CUSTOM_MODELS_PATH", EVAL_ASSIST_DIR / "custom_models.json"
)

logger.debug(f"EVAL_ASSIST_DIR: {EVAL_ASSIST_DIR}")
logger.debug(f"DATA_DIR: {DATA_DIR}")
if DATABASE_URL.startswith("sqlite"):
    logger.debug(f"DATABASE_URL: {DATABASE_URL}")
logger.debug(
    f"UNITXT_INFERENCE_ENGINE_CACHE_PATH: {UNITXT_INFERENCE_ENGINE_CACHE_PATH}"
)
logger.debug(f"UNITXT_CACHE_ENABLED: {UNITXT_CACHE_ENABLED}")
logger.debug(f"STORAGE_ENABLED: {STORAGE_ENABLED}")
logger.debug(f"AUTHENTICATION_ENABLED: {AUTHENTICATION_ENABLED}")
logger.debug(f"UVICORN_WORKERS: {UVICORN_WORKERS}")
logger.debug(f"CUSTOM_MODELS_PATH: {CUSTOM_MODELS_PATH}")


DIRECT_ACTION_PARAMS = {
    "use_cache": False,
    "seed": None,
    "max_tokens": 200,
    "temperature": 0.7,
}

SYNTHETIC_DATA_GENERATION_PARAMS = {
    "use_cache": False,
    "seed": None,
    "max_tokens": 1200,
    "temperature": 1.0,
    "top_p": 0.9,
    "frequency_penalty": 1.0,
    "presence_penalty": 1.5,
}
