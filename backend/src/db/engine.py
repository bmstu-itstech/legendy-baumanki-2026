from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from src.core.config import settings

# Строка подключения к базе данных
DATABASE_URL = settings.DATABASE_URI

# Используем асинхронный движок asyncpg
engine = create_async_engine(DATABASE_URL)

# Асинхронная фабрика сессий базы данных sqlalchemy.
# `expire_on_commit=False` позволяет использовать объекты после коммита.
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)
