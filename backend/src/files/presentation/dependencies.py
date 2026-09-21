from pathlib import Path
from typing import Annotated

from fastapi import Depends
from src.files.config import settings
from src.files.domain.interfaces.file_storage import IFileStorage
from src.files.domain.interfaces.file_uow import IFileUnitOfWork
from src.files.domain.interfaces.task_media_checker import ITaskMediaChecker
from src.files.domain.interfaces.team_provider import ITeamProvider
from src.files.infra.db.uow import PGFileUnitOfWork
from src.files.infra.services.local_file_storage import LocalFileStorage
from src.files.infra.services.pg_task_media_checker import PGTaskMediaChecker
from src.files.infra.services.pg_team_provider import PGTeamProvider


def get_file_uow() -> IFileUnitOfWork:
    return PGFileUnitOfWork()


def get_file_storage() -> IFileStorage:
    return LocalFileStorage(Path(settings.FILES_STORAGE_DIR))


def get_team_provider() -> ITeamProvider:
    return PGTeamProvider()


def get_task_media_checker() -> ITaskMediaChecker:
    return PGTaskMediaChecker()


FileUoWDep = Annotated[IFileUnitOfWork, Depends(get_file_uow)]
FileStorageDep = Annotated[IFileStorage, Depends(get_file_storage)]
TeamProviderDep = Annotated[ITeamProvider, Depends(get_team_provider)]
TaskMediaCheckerDep = Annotated[ITaskMediaChecker, Depends(get_task_media_checker)]
