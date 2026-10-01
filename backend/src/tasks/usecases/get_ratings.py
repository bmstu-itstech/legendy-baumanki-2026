from src.core.logging import log_usecase
from src.tasks.domain.dtos import RatingsListDTO
from src.tasks.domain.interfaces.task_uow import ITaskUnitOfWork


@log_usecase
async def get_ratings(uow: ITaskUnitOfWork) -> RatingsListDTO:
    async with uow:
        ratings = await uow.tasks.get_ratings()
    return RatingsListDTO(ratings=ratings)
