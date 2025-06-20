from evalassist.const import DATABASE_URL, USE_STORAGE
from sqlmodel import SQLModel, create_engine

from .model import AppUser, LogRecord, StoredTestCase  # noqa: F401

print("USE_STORAGE", USE_STORAGE)
engine = None
if USE_STORAGE:
    print("hererererere")
    engine = create_engine(DATABASE_URL)
    SQLModel.metadata.create_all(engine)
