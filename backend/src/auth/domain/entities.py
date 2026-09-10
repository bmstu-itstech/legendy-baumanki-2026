import datetime as dt
from enum import Enum

from src.core.domain.entities import CustomModel


class TokenType(str, Enum):
    """
    Определяет тип токена для аутентификации.
    """

    ACCESS = "access"
    REFRESH = "refresh"


class TokenData(CustomModel):
    """
    Представляет собой наполнение токена.

    Используется непосредственно после декодирование и валидации токена,
    или для генерации нового с заданными параметрами.
    """

    uid: int
    is_superuser: bool = False
    exp: dt.datetime
    iat: dt.datetime | None = None
    jti: str | None = None
    iss: str | None = None


class User(CustomModel):
    """
    Пользователь. Очевидно? Надеюсь.
    """

    id: int
    email: str
    passhash: str
    is_superuser: bool
    created_at: dt.datetime
    updated_at: dt.datetime

    # Вообще говоря utm_* это другой контекст.
    # Но чтобы не плодить контексты ради двух полей,
    # пусть оно будет тут.

    utm_source: str | None
    utm_campaign: str | None


class UserCreate(CustomModel):
    """
    Сырая моделька для создания пользователя.
    """

    email: str
    passhash: str
    utm_source: str | None
    utm_campaign: str | None


class AuthenticatedUser(CustomModel):
    id: int
    is_superuser: bool
