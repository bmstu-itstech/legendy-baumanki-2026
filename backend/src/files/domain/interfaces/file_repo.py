import abc

from src.files.domain.entities import File, FileCreate


class IFileRepository(abc.ABC):
    @abc.abstractmethod
    async def create(self, file: FileCreate) -> File: ...

    @abc.abstractmethod
    async def get_by_id(self, file_id: int) -> File: ...
