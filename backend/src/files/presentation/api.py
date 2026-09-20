from fastapi import APIRouter, UploadFile
from src.files.domain.entities import FileUploadedResponse
from starlette.responses import FileResponse

files_api_router = APIRouter()


@files_api_router.get("/{id}")
def download_file(id: int) -> FileResponse:
    raise NotImplementedError


@files_api_router.post("/upload")
def upload_file(file: UploadFile) -> FileUploadedResponse:
    raise NotImplementedError
