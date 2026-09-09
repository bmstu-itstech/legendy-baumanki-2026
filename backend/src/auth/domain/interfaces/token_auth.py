import abc
from typing import TypeVar

from src.auth.domain.entities import AuthUser, TokenData, TokenType
from src.auth.domain.interfaces.token_provider import ITokenProvider
from src.auth.domain.interfaces.token_storage import ITokenStorage

TResponse = TypeVar("TResponse")


class ITokenAuth(abc.ABC):
    """
    Интерфейс для аутентификации, основанной на токенах.

    Выступает мостом между транспортным уровнем (провайдерами), такими как
    куки или HTTP-заголовками, и опционально, с хранилищем токенов.
    """

    _provider: ITokenProvider
    _storage: ITokenStorage | None

    def __init__(self, provider: ITokenProvider, storage: ITokenStorage | None = None):
        self._provider = provider
        self._storage = storage

    @abc.abstractmethod
    async def set_tokens(self, user: AuthUser) -> None:
        """Устанавливает access и refresh токены в ответе."""

    @abc.abstractmethod
    async def set_token(self, token: str, token_type: TokenType) -> None:
        """Устанавливает конкретный токен в ответ."""

    @abc.abstractmethod
    async def unset_tokens(self) -> None:
        """Удаляет все токены"""

    @abc.abstractmethod
    async def refresh_access_token(self) -> None:
        """Обновляет access токен используя refresh токен"""

    @abc.abstractmethod
    async def read_token(self, token_type: TokenType) -> TokenData | None:
        """Читает заданный токен из запроса и возвращает его контест или None"""

    @abc.abstractmethod
    async def inject_access_token_from_request(self, response: TResponse) -> None:
        """
        Метод, специфичный для middleware.

        Если в ходе обработки запроса был сохранён обновлённый access-токен,
        то он вставляется в ответ.
        """
