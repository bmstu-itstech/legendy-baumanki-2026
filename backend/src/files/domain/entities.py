import datetime as dt

from src.core.domain.entities import CustomModel


class FileUploadedResponse(CustomModel):
    file_id: int


class File(CustomModel):
    id: int
    filename: str
    content_type: str
    size: int
    storage_key: str
    uploaded_by: int
    created_at: dt.datetime


class FileCreate(CustomModel):
    filename: str
    content_type: str
    size: int
    storage_key: str
    uploaded_by: int
