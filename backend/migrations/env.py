from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool
from src.auth.infra.db.orm import UserModel  # noqa: F401
from src.core.config import settings
from src.db.base import BaseModel
from src.files.infra.db.orm import FileModel  # noqa: F401
from src.profile.infra.db.orm import (
    ProfileModel,  # noqa: F401
    TeamModel,  # noqa: F401
)
from src.tasks.infra.db.orm import (
    ModuleModel,  # noqa: F401
    SectionModel,  # noqa: F401
    StateModel,  # noqa: F401
    TaskAnswerModel,  # noqa: F401
    TaskMediaModel,  # noqa: F401
    TaskModel,  # noqa: F401
    TaskQuestionModel,  # noqa: F401
    TeamAnswerModel,  # noqa: F401
)

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = BaseModel.metadata


def get_url():
    return str(settings.ALEMBIC_DATABASE_URI)


def run_migrations_offline() -> None:
    context.configure(
        url=get_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section) or {},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        url=get_url(),
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
