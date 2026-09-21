from pathlib import Path
from uuid import uuid4

from src.files.domain.interfaces.file_storage import IFileStorage


class LocalFileStorage(IFileStorage):
    def __init__(self, base_dir: Path):
        self.base_dir = base_dir
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save(self, content: bytes, extension: str) -> str:
        storage_key = f"{uuid4().hex}{extension}"
        (self.base_dir / storage_key).write_bytes(content)
        return storage_key

    def path_for(self, storage_key: str) -> Path:
        return self.base_dir / storage_key

    def delete(self, storage_key: str) -> None:
        self.path_for(storage_key).unlink(missing_ok=True)
