from pathlib import Path

from src.core.domain.exceptions.exceptions import NotAuthenticated
from src.files.config import settings
from src.files.domain.entities import FileCreate
from src.files.domain.exceptions import FileTooLarge
from src.files.domain.interfaces.file_storage import IFileStorage
from src.files.domain.interfaces.file_uow import IFileUnitOfWork


async def upload_file(
    filename: str,
    content_type: str,
    content: bytes,
    uploaded_by: int | None,
    storage: IFileStorage,
    uow: IFileUnitOfWork,
) -> int:
    if uploaded_by is None:
        raise NotAuthenticated()
    if len(content) > settings.max_upload_size_bytes:
        raise FileTooLarge()

    extension = Path(filename).suffix
    storage_key = storage.save(content, extension)

    try:
        async with uow:
            file = await uow.files.create(
                FileCreate(
                    filename=filename,
                    content_type=content_type,
                    size=len(content),
                    storage_key=storage_key,
                    uploaded_by=uploaded_by,
                )
            )
            await uow.commit()
    except Exception:
        storage.delete(storage_key)
        raise

    return file.id
