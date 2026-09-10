import abc

from src.auth.domain.entities import TokenData


class ITokenStorage(abc.ABC):
    """
    Интерфейс для хранения и управления выданными токенами.

    Эта абстракция нужна исключительно для того, чтобы можно было в случае
    выхода пользователя удалить этот токен из хранилища и, тем самым, признать
    его недействительным. Дополнительно имеется возможность управления
    административного управления этими самыми токенами... но кого я обманываю.
    Чтобы этот интерфейс получил реализацию больше, чем сохранение, дай Бог,
    в редис...
    """

    @abc.abstractmethod
    async def store_token(self, token: TokenData) -> None:
        """Сохраняет токен."""

    @abc.abstractmethod
    async def revoke_tokens_by_user(self, user_id: int) -> None:
        """Отзывает все токены, связанные с пользователем."""

    @abc.abstractmethod
    async def is_token_active(self, jti: str) -> bool:
        """Проверяет, активен ли токен."""
