from fastapi import APIRouter

from src.auth.presentation.dependencies import TokenAuthDep
from src.auth.presentation.permissions import access_control
from src.final.domain.dtos import FinalOverviewDTO
from src.final.presentation.dependencies import FinalUoWDep, TeamProviderDep
from src.final.usecases import book_final_slot, cancel_final_booking, get_final

final_api_router = APIRouter()


@final_api_router.get("", response_model=FinalOverviewDTO)
@access_control()
async def api_get_final(
    uow: FinalUoWDep,
    auth: TokenAuthDep,
    team_provider: TeamProviderDep,
) -> FinalOverviewDTO:
    uid = auth.request.state.user.id
    return await get_final(uid, uow, team_provider)


@final_api_router.post("/slots/{slot_id}/book", response_model=FinalOverviewDTO)
@access_control()
async def api_book_final_slot(
    slot_id: int,
    uow: FinalUoWDep,
    auth: TokenAuthDep,
    team_provider: TeamProviderDep,
) -> FinalOverviewDTO:
    uid = auth.request.state.user.id
    return await book_final_slot(uid, slot_id, uow, team_provider)


@final_api_router.delete("/booking", response_model=FinalOverviewDTO)
@access_control()
async def api_cancel_final_booking(
    uow: FinalUoWDep,
    auth: TokenAuthDep,
    team_provider: TeamProviderDep,
) -> FinalOverviewDTO:
    uid = auth.request.state.user.id
    return await cancel_final_booking(uid, uow, team_provider)
