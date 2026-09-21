from sqlalchemy import exists, select
from src.db.engine import async_session_maker
from src.files.domain.interfaces.task_media_checker import ITaskMediaChecker
from src.tasks.infra.db.orm import TaskMediaModel


class PGTaskMediaChecker(ITaskMediaChecker):
    async def is_task_media(self, file_id: int) -> bool:
        async with async_session_maker() as session:
            stmt = select(exists().where(TaskMediaModel.file_id == file_id))
            return bool(await session.scalar(stmt))
