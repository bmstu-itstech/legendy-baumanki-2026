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


class AuthUser(CustomModel):
    id: int
    is_superuser: bool
