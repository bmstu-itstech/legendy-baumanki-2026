from src.final.config import settings
from src.final.domain.dtos import FinalOverviewDTO, FinalSlotDTO
from src.final.domain.entities import TeamInfo
from src.final.domain.interfaces.final_uow import IFinalUnitOfWork
from src.utils.datetimes import get_timezone_now


async def build_overview(
    user_id: int,
    team: TeamInfo | None,
    uow: IFinalUnitOfWork,
) -> FinalOverviewDTO:
    async with uow:
        slots = await uow.final.get_slots()
        booked_slot_id = (
            await uow.final.get_team_slot_id(team.id) if team is not None else None
        )
    deadline = settings.FINAL_BOOKING_DEADLINE
    return FinalOverviewDTO(
        deadline=deadline,
        booking_open=get_timezone_now() < deadline,
        has_team=team is not None,
        is_captain=team is not None and team.leader_id == user_id,
        booked_slot_id=booked_slot_id,
        team_size=team.size if team is not None else None,
        min_team_size=settings.FINAL_TEAM_MIN_SIZE,
        slots=[FinalSlotDTO(**slot.model_dump()) for slot in slots],
    )
