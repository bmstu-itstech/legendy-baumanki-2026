import datetime as dt

from pydantic import Field
from src.core.domain.entities import CustomModel


class User(CustomModel):
    """
    Пользователь. Очевидно? Надеюсь.
    """

    id: int
    email: str = Field
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
