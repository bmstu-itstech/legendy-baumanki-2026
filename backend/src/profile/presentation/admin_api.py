from fastapi import APIRouter, Depends

from src.auth.presentation.permissions import require_superuser
from src.profile.domain.dtos import AdminTeamDTO
from src.profile.presentation.dependencies import EmailProviderDep, ProfileUoWDep
from src.profile.usecases import admin_get_team

# Авторизация на весь роутер: email участников видят только организаторы.
admin_teams_api_router = APIRouter(dependencies=[Depends(require_superuser)])


@admin_teams_api_router.get("/{team_id}", response_model=AdminTeamDTO)
async def api_admin_get_team(
    team_id: int,
    uow: ProfileUoWDep,
    email_provider: EmailProviderDep,
) -> AdminTeamDTO:
    return await admin_get_team(team_id, uow, email_provider)
