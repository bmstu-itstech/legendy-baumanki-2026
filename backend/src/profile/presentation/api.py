from fastapi import APIRouter
from src.auth.presentation.dependencies import TokenAuthDep
from src.auth.presentation.permissions import access_control
from src.profile.domain.dtos import (
    ProfileCreateDTO,
    ProfileReadDTO,
    ProfileUpdateDTO,
    TeamCreatedDTO,
    TeamCreateDTO,
    TeamUpdateDTO,
    TeamWithMembersDTO,
)
from src.profile.presentation.dependencies import (
    EmailProviderDep,
    ProfileUoWDep,
    TeamCodeProviderDep,
)
from src.profile.usecases import (
    create_profile,
    create_team,
    get_profile,
    get_team_by_user,
    join_team,
    leave_team,
    update_profile,
    update_team,
)

profiles_api_router = APIRouter()
teams_api_router = APIRouter()


@profiles_api_router.post("")
async def api_create_profile(
    profile: ProfileCreateDTO,
    uow: ProfileUoWDep,
    email_provider: EmailProviderDep,
) -> ProfileReadDTO:
    return await create_profile(profile, uow, email_provider)


@profiles_api_router.get("/me", response_model=ProfileReadDTO)
async def api_get_me(
    uow: ProfileUoWDep,
    email_provider: EmailProviderDep,
    auth: TokenAuthDep,
) -> ProfileReadDTO:
    uid = auth.request.state.user.id
    return await get_profile(uid, uow, email_provider)


@profiles_api_router.patch("/me", response_model=ProfileReadDTO)
async def api_update_profile(
    profile_data: ProfileUpdateDTO,
    uow: ProfileUoWDep,
    email_provider: EmailProviderDep,
) -> ProfileReadDTO:
    return await update_profile(profile_data, uow, email_provider)


@teams_api_router.post("")
@access_control(opened=True)
async def api_create_team(
    team_data: TeamCreateDTO,
    auth: TokenAuthDep,
    uow: ProfileUoWDep,
    code_provider: TeamCodeProviderDep,
) -> TeamCreatedDTO:
    uid = auth.request.state.user.id
    return await create_team(uid, team_data, uow, code_provider)


@teams_api_router.get("/my")
async def api_get_my_team(
    uow: ProfileUoWDep,
    email_provider: EmailProviderDep,
    auth: TokenAuthDep,
) -> TeamWithMembersDTO:
    uid = auth.request.state.user.id
    return await get_team_by_user(uid, uow, email_provider)


@teams_api_router.patch("", response_model=TeamWithMembersDTO)
async def api_patch_team(
    data: TeamUpdateDTO,
    uow: ProfileUoWDep,
    email_provider: EmailProviderDep,
    auth: TokenAuthDep,
) -> TeamWithMembersDTO:
    uid = auth.request.state.user.id
    return await update_team(uid, data, uow, email_provider)


@teams_api_router.post("/{team_code}/join")
async def api_join_team(
    team_code: str,
    uow: ProfileUoWDep,
    auth: TokenAuthDep,
):
    uid = auth.request.state.user.id
    return await join_team(uid, team_code, uow)


@teams_api_router.post("/leave")
async def api_leave_team(
    uow: ProfileUoWDep,
    auth: TokenAuthDep,
):
    uid = auth.request.state.user.id
    return await leave_team(uid, uow)
