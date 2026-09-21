from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.files.domain.entities import File, FileCreate
from src.files.domain.exceptions import FileNotFound
from src.files.domain.interfaces.file_repo import IFileRepository
from src.files.infra.db.orm import FileModel


class PGFileRepository(IFileRepository):
    def __init__(self, session: AsyncSession):
        super().__init__()
        self.session = session

    async def create(self, file: FileCreate) -> File:
        obj = FileModel(**file.model_dump(mode="json"))
        self.session.add(obj)
        await self.session.flush()
        return self._to_domain(obj)

    async def get_by_id(self, file_id: int) -> File:
        stmt = select(FileModel).where(FileModel.id == file_id)
        result = await self.session.execute(stmt)
        obj: FileModel | None = result.scalar_one_or_none()
        if obj is None:
            raise FileNotFound(detail=f"File with id {file_id} not found")
        return self._to_domain(obj)

    @staticmethod
    def _to_domain(obj: FileModel) -> File:
        return File(
            id=obj.id,
            filename=obj.filename,
            content_type=obj.content_type,
            size=obj.size,
            storage_key=obj.storage_key,
            uploaded_by=obj.uploaded_by,
            created_at=obj.created_at,
        )
