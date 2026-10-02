from src.core.logging import log_usecase
from src.final.config import settings
from src.final.domain.dtos import FinalOverviewDTO
from src.final.domain.entities import ensure_booking_open
from src.final.domain.exceptions import TeamAlreadyBookedFinal
from src.final.domain.interfaces.final_uow import IFinalUnitOfWork
from src.final.domain.interfaces.team_provider import ITeamProvider
from src.final.usecases.captain import get_captain_team
from src.final.usecases.overview import build_overview
from src.utils.datetimes import get_timezone_now


@log_usecase
async def book_final_slot(
    user_id: int,
    slot_id: int,
    uow: IFinalUnitOfWork,
    team_provider: ITeamProvider,
) -> FinalOverviewDTO:
    team = await get_captain_team(user_id, team_provider)
    ensure_booking_open(get_timezone_now(), settings.FINAL_BOOKING_DEADLINE)
    team.ensure_big_enough(settings.FINAL_TEAM_MIN_SIZE)
    async with uow:
        # Перезаписи на другой слот нет: сначала отмена, потом новая запись.
        if await uow.final.get_team_slot_id(team.id) is not None:
            raise TeamAlreadyBookedFinal()
        slot = await uow.final.lock_slot(slot_id)
        slot.ensure_has_place()
        await uow.final.create_booking(team.id, slot.id)
        await uow.commit()
    return await build_overview(user_id, team, uow)
