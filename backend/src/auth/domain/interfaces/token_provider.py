import abc

from src.auth.domain.entities import TokenData


class ITokenProvider(abc.ABC):
    @abc.abstractmethod
    def create_access_token(self, data: dict) -> str:
        """Создаёт новый access токен"""

    @abc.abstractmethod
    def create_refresh_token(self, data: dict) -> str:
        """Создаёт новый refresh токен"""

    @abc.abstractmethod
    def read_token(self, token: str | None) -> TokenData | None:
        """Читает токен из строки и возвращает TokenData или None"""
