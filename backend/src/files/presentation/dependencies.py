from pathlib import Path
from typing import Annotated

from fastapi import Depends
from src.files.config import settings
from src.files.domain.interfaces.file_storage import IFileStorage
from src.files.domain.interfaces.file_uow import IFileUnitOfWork
from src.files.infra.db.uow import PGFileUnitOfWork
from src.files.infra.services.local_file_storage import LocalFileStorage


def get_file_uow() -> IFileUnitOfWork:
    return PGFileUnitOfWork()


def get_file_storage() -> IFileStorage:
    return LocalFileStorage(Path(settings.FILES_STORAGE_DIR))


FileUoWDep = Annotated[IFileUnitOfWork, Depends(get_file_uow)]
FileStorageDep = Annotated[IFileStorage, Depends(get_file_storage)]
