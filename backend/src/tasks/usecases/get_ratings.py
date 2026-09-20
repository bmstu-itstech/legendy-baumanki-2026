from src.tasks.domain.dtos import RatingsListDTO
from src.tasks.domain.interfaces.task_uow import ITaskUnitOfWork


async def get_ratings(uow: ITaskUnitOfWork) -> RatingsListDTO:
    async with uow:
        ratings = await uow.tasks.get_ratings()
    return RatingsListDTO(ratings=ratings)
