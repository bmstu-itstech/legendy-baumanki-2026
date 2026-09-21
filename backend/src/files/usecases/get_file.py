from src.files.domain.interfaces.file_storage import IFileStorage
from src.files.domain.interfaces.file_uow import IFileUnitOfWork
from starlette.responses import FileResponse


async def get_file(file_id: int, uow: IFileUnitOfWork, storage: IFileStorage) -> FileResponse:
    async with uow:
        file = await uow.files.get_by_id(file_id)

    # Без filename= — иначе Starlette проставит Content-Disposition: attachment,
    # и уже готовые <img src=".../files/{id}"> / <video> / <audio> на фронте
    # (components/tasks/task-detail-page.tsx) могут перестать рендериться инлайн.
    return FileResponse(path=storage.path_for(file.storage_key), media_type=file.content_type)
