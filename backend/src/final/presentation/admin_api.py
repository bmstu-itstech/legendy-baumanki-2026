from typing import Annotated

from fastapi import APIRouter, Depends, Request

from src.auth.presentation.permissions import require_superuser
from src.final.domain.dtos import AdminFinalAddTeamDTO, AdminFinalDTO
from src.final.presentation.dependencies import FinalUoWDep
from src.final.usecases import (
    admin_add_final_team,
    admin_get_final,
    admin_remove_final_team,
)


def get_actor_id(request: Request) -> int:
    # Роутер уже требует суперюзера, так что пользователь здесь всегда есть.
    return request.state.user.id


ActorIdDep = Annotated[int, Depends(get_actor_id)]

# Авторизация на весь роутер — новый эндпоинт не останется без проверки.
admin_final_api_router = APIRouter(dependencies=[Depends(require_superuser)])


@admin_final_api_router.get("", response_model=AdminFinalDTO)
async def api_admin_get_final(uow: FinalUoWDep) -> AdminFinalDTO:
    return await admin_get_final(uow)


@admin_final_api_router.post("/slots/{slot_id}/teams", response_model=AdminFinalDTO)
async def api_admin_add_final_team(
    slot_id: int,
    data: AdminFinalAddTeamDTO,
    uow: FinalUoWDep,
    actor_id: ActorIdDep,
) -> AdminFinalDTO:
    return await admin_add_final_team(actor_id, slot_id, data.team_id, uow)


@admin_final_api_router.delete(
    "/slots/{slot_id}/teams/{team_id}", response_model=AdminFinalDTO
)
async def api_admin_remove_final_team(
    slot_id: int,
    team_id: int,
    uow: FinalUoWDep,
    actor_id: ActorIdDep,
) -> AdminFinalDTO:
    return await admin_remove_final_team(actor_id, slot_id, team_id, uow)
