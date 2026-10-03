from src.core.logging import log_usecase
from src.final.domain.dtos import FinalOverviewDTO
from src.final.domain.interfaces.final_uow import IFinalUnitOfWork
from src.final.domain.interfaces.team_provider import ITeamProvider
from src.final.usecases.overview import build_overview


@log_usecase
async def get_final(
    user_id: int,
    uow: IFinalUnitOfWork,
    team_provider: ITeamProvider,
) -> FinalOverviewDTO:
    team = await team_provider.get_team(user_id)
    return await build_overview(user_id, team, uow)
