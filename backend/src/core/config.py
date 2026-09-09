import os
from typing import Literal

from pydantic import AnyUrl, ConfigDict, PostgresDsn, field_validator
from pydantic_core.core_schema import ValidationInfo
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = os.environ.get("PROJECT_NAME", "LEGENDY_BAUMANKI_2026")
    API_V1_STR: str = "/api/v1"
    DOMAIN: str = os.environ.get("DOMAIN")
    SECRET_KEY: str = os.environ.get("SECRET_KEY")

    DB_TYPE: Literal["POSTGRESQL", "ASYNC_POSTGRESQL"] = "POSTGRESQL"
    DB_NAME: str = os.environ.get("DB_NAME")
    DB_USER: str = os.environ.get("DB_USER")
    DB_PASSWORD: str = os.environ.get("DB_PASSWORD")
    DB_HOST: str = os.environ.get("DB_HOST")
    DB_PORT: str = os.environ.get("DB_PORT")
    DATABASE_URI: AnyUrl | None = None
    ALEMBIC_DATABASE_URI: AnyUrl | None = None

    @staticmethod
    def _build_dsn(scheme: str, values: dict) -> str:
        return str(
            PostgresDsn.build(
                scheme=scheme,
                username=values.get("DB_USER"),
                password=values.get("DB_PASSWORD"),
                host=values.get("DB_HOST"),
                port=int(values["DB_PORT"]) if "DB_PORT" in values else None,
                path=values.get("DB_NAME"),
            )
        )

    @field_validator("DATABASE_URI")
    @classmethod
    def assemble_database_uri(cls, v: str | None, info: ValidationInfo) -> str:
        if v is not None:
            return v
        db_type = info.data.get("DB_TYPE")
        if db_type == "POSTGRESQL":
            return cls._build_dsn("postgresql+psycopg", info.data)
        elif db_type == "ASYNC_POSTGRESQL":
            return cls._build_dsn("postgresql+asyncpg", info.data)
        raise ValueError(f"Unsupported database type: {db_type}")

    @field_validator("ALEMBIC_DATABASE_URI")
    @classmethod
    def assemble_alembic_database_uri(cls, v: str | None, info: ValidationInfo) -> str:
        if v is not None:
            return v
        db_type = info.data.get("DB_TYPE")
        if db_type in ["POSTGRESQL", "ASYNC_POSTGRESQL"]:
            return cls._build_dsn("postgresql+psycopg", info.data)
        raise ValueError(f"Unsupported database type: {db_type}")

    model_config = ConfigDict()


settings = Settings()
