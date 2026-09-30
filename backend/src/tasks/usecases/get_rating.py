from src.core.logging import log_usecase
from src.tasks.domain.dtos import RatingDetailDTO
from src.tasks.domain.interfaces.task_uow import ITaskUnitOfWork


@log_usecase
async def get_rating(rating_id: int, uow: ITaskUnitOfWork) -> RatingDetailDTO:
    async with uow:
        return await uow.tasks.get_rating(rating_id)
