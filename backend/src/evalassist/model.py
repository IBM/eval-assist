import datetime

from sqlalchemy import Column, DateTime, func
from sqlmodel import Field, Relationship, SQLModel


class AppUser(SQLModel, table=True):
    __tablename__ = "app_user"
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    name: str
    created_at: datetime.datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(), server_default=func.now(), nullable=False),
    )
    stored_test_cases: list["StoredTestCase"] = Relationship(back_populates="app_user")
    log_records: list["LogRecord"] = Relationship(back_populates="app_user")


class StoredTestCase(SQLModel, table=True):
    __tablename__ = "stored_test_case"
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="app_user.id")
    content: str
    name: str

    app_user: AppUser | None = Relationship(back_populates="stored_test_cases")


class LogRecord(SQLModel, table=True):
    __tablename__ = "log_record"
    id: int | None = Field(default=None, primary_key=True)
    data: str
    user_id: int = Field(foreign_key="app_user.id")

    app_user: AppUser | None = Relationship(back_populates="log_records")
