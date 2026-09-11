import datetime as dt

from sqlalchemy import Boolean, String, func
from sqlalchemy.orm import Mapped, mapped_column
from src.db.base import BaseModel


class UserModel(BaseModel):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    email: Mapped[str] = mapped_column(String(length=255), unique=True, nullable=False)

    passhash: Mapped[str] = mapped_column(String(length=127), nullable=False)

    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    utm_source: Mapped[str | None] = mapped_column(
        String(length=63),
        default=None,
        nullable=True,
    )

    utm_campaign: Mapped[str | None] = mapped_column(
        String(length=63),
        default=None,
        nullable=True,
    )

    created_at: Mapped[dt.datetime] = mapped_column(
        server_default=func.now(),
    )

    updated_at: Mapped[dt.datetime] = mapped_column(
        server_default=func.now(),
        onupdate=func.now(),
    )
