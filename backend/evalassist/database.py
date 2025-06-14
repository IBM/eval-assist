from evalassist.const import DATABASE_URL
from .model import AppUser, StoredTestCase, LogRecord
from sqlmodel import SQLModel, create_engine
engine = create_engine(DATABASE_URL)
SQLModel.metadata.create_all(engine)