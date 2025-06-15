from datetime import datetime
from typing import List, Optional

from sqlmodel import Field, Relationship, SQLModel


class AppUser(SQLModel, table=True):
    __tablename__ = "app_user"
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    stored_test_cases: List["StoredTestCase"] = Relationship(back_populates="app_user")


class StoredTestCase(SQLModel, table=True):
    __tablename__ = "stored_test_case"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="app_user.id")
    content: str
    name: str

    app_user: Optional[AppUser] = Relationship(back_populates="stored_test_cases")


class LogRecord(SQLModel, table=True):
    __tablename__ = "log_record"
    id: Optional[int] = Field(default=None, primary_key=True)
    data: str
