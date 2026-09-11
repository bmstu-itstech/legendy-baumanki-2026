import abc

from src.auth.domain.entities import User, UserCreate


class IUserRepository(abc.ABC):
    """
    Интерфейс для репозитория пользователей.

    Определяет контракт для операций с данными, связанными с пользователями.
    """

    @abc.abstractmethod
    async def create(self, user: UserCreate) -> User:
        """Создаёт нового пользователя и сохраняет его в БД."""

    @abc.abstractmethod
    async def get_by_id(self, user_id: int) -> User:
        """Возвращает пользователя с заданным ID"""

    @abc.abstractmethod
    async def get_by_email(self, email: str) -> User:
        """Возвращает пользователя с заданным email"""
