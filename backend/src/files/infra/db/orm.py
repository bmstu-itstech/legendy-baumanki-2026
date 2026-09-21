import datetime as dt

from sqlalchemy import String, func
from sqlalchemy.orm import Mapped, mapped_column
from src.db.base import BaseModel


class FileModel(BaseModel):
    __tablename__ = "files"

    id: Mapped[int] = mapped_column(primary_key=True)

    filename: Mapped[str] = mapped_column(String(255), nullable=False)

    content_type: Mapped[str] = mapped_column(String(127), nullable=False)

    size: Mapped[int] = mapped_column(nullable=False)

    storage_key: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)

    # Без FK на profiles.user_id — как и в task_media.file_id, загрузивший
    # не обязан иметь профиль к моменту загрузки.
    uploaded_by: Mapped[int] = mapped_column(nullable=False)

    created_at: Mapped[dt.datetime] = mapped_column(server_default=func.now())
