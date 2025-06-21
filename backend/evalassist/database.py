from evalassist.const import DATABASE_URL, USE_STORAGE
from sqlmodel import SQLModel, create_engine

from .model import AppUser, LogRecord, StoredTestCase  # noqa: F401

engine = None
if USE_STORAGE:
    engine = create_engine(DATABASE_URL)
    SQLModel.metadata.create_all(engine)
