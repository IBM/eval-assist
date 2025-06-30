import alembic.command
import alembic.config
from evalassist.const import DATABASE_URL, EVAL_ASSIST_DIR, STORAGE_ENABLED
from sqlmodel import create_engine

from .model import AppUser, LogRecord, StoredTestCase  # noqa: F401

engine = None
if STORAGE_ENABLED:
    engine = create_engine(DATABASE_URL)

    alembic_cfg = alembic.config.Config(
        EVAL_ASSIST_DIR / "alembic.ini", config_args={"sqlalchemy.url": DATABASE_URL}
    )
    alembic.command.upgrade(alembic_cfg, "head")
