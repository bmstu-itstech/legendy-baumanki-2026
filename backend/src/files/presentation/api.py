from fastapi import APIRouter, UploadFile
from src.auth.presentation.dependencies import TokenAuthDep
from src.files.domain.entities import FileUploadedResponse
from src.files.presentation.dependencies import (
    FileStorageDep,
    FileUoWDep,
    TaskMediaCheckerDep,
    TeamProviderDep,
)
from src.files.usecases import get_file, upload_file
from starlette.responses import FileResponse

files_api_router = APIRouter()


@files_api_router.get("/{id}")
async def download_file(
    id: int,
    auth: TokenAuthDep,
    uow: FileUoWDep,
    storage: FileStorageDep,
    team_provider: TeamProviderDep,
    task_media_checker: TaskMediaCheckerDep,
) -> FileResponse:
    user = auth.request.state.user
    return await get_file(
        id, user.id, user.is_superuser, uow, storage, team_provider, task_media_checker
    )


@files_api_router.post("/upload")
async def api_upload_file(
    file: UploadFile,
    auth: TokenAuthDep,
    uow: FileUoWDep,
    storage: FileStorageDep,
) -> FileUploadedResponse:
    uid = auth.request.state.user.id
    content = await file.read()
    file_id = await upload_file(
        file.filename or "file",
        file.content_type or "application/octet-stream",
        content,
        uid,
        storage,
        uow,
    )
    return FileUploadedResponse(file_id=file_id)
