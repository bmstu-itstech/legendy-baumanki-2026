from src.core.logging import log_usecase
from src.final.config import settings
from src.final.domain.dtos import (
    AdminFinalBookedTeamDTO,
    AdminFinalDTO,
    AdminFinalSlotDTO,
    AdminFinalTeamDTO,
)
from src.final.domain.exceptions import (
    FinalBookingNotFound,
    FinalTeamNotFound,
    TeamAlreadyBookedFinal,
)
from src.final.domain.interfaces.final_uow import IFinalUnitOfWork

# Организатор действует в обход капитана, дедлайна и минимального размера
# команды (например, команда записывается в день финала на месте), но не в
# обход вместимости слота.
# actor_id в бизнес-логике не участвует — нужен для аудит-лога (@log_usecase).


async def _overview(uow: IFinalUnitOfWork) -> AdminFinalDTO:
    async with uow:
        slots = await uow.final.get_slots()
        bookings = await uow.final.get_bookings()
        unbooked = await uow.final.get_unbooked_teams()
    teams_by_slot: dict[int, list[AdminFinalBookedTeamDTO]] = {}
    for booking in bookings:
        teams_by_slot.setdefault(booking.slot_id, []).append(
            AdminFinalBookedTeamDTO(
                **booking.team.model_dump(), booked_at=booking.booked_at
            )
        )
    return AdminFinalDTO(
        min_team_size=settings.FINAL_TEAM_MIN_SIZE,
        slots=[
            AdminFinalSlotDTO(**slot.model_dump(), teams=teams_by_slot.get(slot.id, []))
            for slot in slots
        ],
        unbooked_teams=[AdminFinalTeamDTO(**team.model_dump()) for team in unbooked],
    )


@log_usecase
async def admin_get_final(uow: IFinalUnitOfWork) -> AdminFinalDTO:
    return await _overview(uow)


@log_usecase
async def admin_add_final_team(
    actor_id: int,
    slot_id: int,
    team_id: int,
    uow: IFinalUnitOfWork,
) -> AdminFinalDTO:
    async with uow:
        if not await uow.final.team_exists(team_id):
            raise FinalTeamNotFound()
        if await uow.final.get_team_slot_id(team_id) is not None:
            raise TeamAlreadyBookedFinal()
        slot = await uow.final.lock_slot(slot_id)
        slot.ensure_has_place()
        await uow.final.create_booking(team_id, slot.id)
        await uow.commit()
    return await _overview(uow)


@log_usecase
async def admin_remove_final_team(
    actor_id: int,
    slot_id: int,
    team_id: int,
    uow: IFinalUnitOfWork,
) -> AdminFinalDTO:
    async with uow:
        if not await uow.final.delete_slot_booking(slot_id, team_id):
            raise FinalBookingNotFound()
        await uow.commit()
    return await _overview(uow)
