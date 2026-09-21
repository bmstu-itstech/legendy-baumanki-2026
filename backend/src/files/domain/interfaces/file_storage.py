import abc
from pathlib import Path


class IFileStorage(abc.ABC):
    @abc.abstractmethod
    def save(self, content: bytes, extension: str) -> str:
        """Сохраняет содержимое файла, возвращает storage_key."""

    @abc.abstractmethod
    def path_for(self, storage_key: str) -> Path: ...

    @abc.abstractmethod
    def delete(self, storage_key: str) -> None: ...
