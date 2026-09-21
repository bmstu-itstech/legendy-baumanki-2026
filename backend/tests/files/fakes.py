from pathlib import Path

from src.files.domain.entities import File, FileCreate
from src.files.domain.interfaces.file_repo import IFileRepository
from src.files.domain.interfaces.file_storage import IFileStorage
from src.files.domain.interfaces.file_uow import IFileUnitOfWork
from src.files.domain.interfaces.task_media_checker import ITaskMediaChecker
from src.files.domain.interfaces.team_provider import ITeamProvider


class FakeFileRepository(IFileRepository):
    def __init__(self, file: File):
        self._file = file

    async def create(self, file: FileCreate) -> File:
        raise NotImplementedError

    async def get_by_id(self, file_id: int) -> File:
        assert file_id == self._file.id
        return self._file


class FakeFileUoW(IFileUnitOfWork):
    def __init__(self, file: File):
        self.files = FakeFileRepository(file)

    async def rollback(self) -> None:
        pass

    async def _commit(self) -> None:
        pass


class FakeFileStorage(IFileStorage):
    def save(self, content: bytes, extension: str) -> str:
        raise NotImplementedError

    def path_for(self, storage_key: str) -> Path:
        return Path("/tmp") / storage_key

    def delete(self, storage_key: str) -> None:
        pass


class FakeTeamProvider(ITeamProvider):
    """teams: user_id -> team_id (или None, если пользователь без команды)."""

    def __init__(self, teams: dict[int, int | None]):
        self._teams = teams

    async def get_team_id(self, user_id: int) -> int | None:
        return self._teams.get(user_id)


class FakeTaskMediaChecker(ITaskMediaChecker):
    def __init__(self, public_file_ids: set[int] = frozenset()):
        self._public_file_ids = public_file_ids

    async def is_task_media(self, file_id: int) -> bool:
        return file_id in self._public_file_ids
