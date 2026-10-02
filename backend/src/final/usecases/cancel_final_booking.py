from src.core.logging import log_usecase
from src.final.config import settings
from src.final.domain.dtos import FinalOverviewDTO
from src.final.domain.entities import ensure_booking_open
from src.final.domain.exceptions import FinalBookingNotFound
from src.final.domain.interfaces.final_uow import IFinalUnitOfWork
from src.final.domain.interfaces.team_provider import ITeamProvider
from src.final.usecases.captain import get_captain_team
from src.final.usecases.overview import build_overview
from src.utils.datetimes import get_timezone_now


@log_usecase
async def cancel_final_booking(
    user_id: int,
    uow: IFinalUnitOfWork,
    team_provider: ITeamProvider,
) -> FinalOverviewDTO:
    team = await get_captain_team(user_id, team_provider)
    ensure_booking_open(get_timezone_now(), settings.FINAL_BOOKING_DEADLINE)
    async with uow:
        if not await uow.final.delete_booking(team.id):
            raise FinalBookingNotFound()
        await uow.commit()
    return await build_overview(user_id, team, uow)
