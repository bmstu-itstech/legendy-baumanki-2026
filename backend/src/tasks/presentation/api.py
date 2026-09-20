from fastapi import APIRouter
from src.auth.presentation.dependencies import TokenAuthDep
from src.tasks.domain.dtos import (
    AnswerTaskDTO,
    ModuleDetailsDTO,
    ModulesListDTO,
    RatingDetailDTO,
    RatingsListDTO,
    TaskDTO,
)
from src.tasks.presentation.dependencies import TaskUoWDep, TeamProviderDep
from src.tasks.usecases import *

modules_api_router = APIRouter()
tasks_api_router = APIRouter()
ratings_api_router = APIRouter()


@modules_api_router.get("/", response_model=ModulesListDTO)
async def api_get_modules(
    uow: TaskUoWDep,
    auth: TokenAuthDep,
    team_provider: TeamProviderDep,
) -> ModulesListDTO:
    uid = auth.request.state.user.id
    return await get_modules(uid, uow, team_provider)


@modules_api_router.get("/{id}", response_model=ModuleDetailsDTO)
async def api_get_module(
    id: int,
    uow: TaskUoWDep,
    auth: TokenAuthDep,
    team_provider: TeamProviderDep,
) -> ModuleDetailsDTO:
    uid = auth.request.state.user.id
    return await get_module(id, uid, uow, team_provider)


@tasks_api_router.get("/{id}", response_model=TaskDTO)
async def api_get_task(
    id: int,
    uow: TaskUoWDep,
    auth: TokenAuthDep,
    team_provider: TeamProviderDep,
) -> TaskDTO:
    uid = auth.request.state.user.id
    return await get_task(id, uid, uow, team_provider)


@tasks_api_router.post("/{id}/start", response_model=TaskDTO)
async def api_start_task(
    id: int,
    uow: TaskUoWDep,
    auth: TokenAuthDep,
    team_provider: TeamProviderDep,
) -> TaskDTO:
    uid = auth.request.state.user.id
    return await start_task(id, uid, uow, team_provider)


@tasks_api_router.post("/{id}/answer", response_model=TaskDTO)
async def api_answer_task(
    id: int,
    dto: AnswerTaskDTO,
    uow: TaskUoWDep,
    auth: TokenAuthDep,
    team_provider: TeamProviderDep,
) -> TaskDTO:
    uid = auth.request.state.user.id
    return await answer_task(id, uid, dto, uow, team_provider)


@tasks_api_router.put("/{id}/skip", response_model=TaskDTO)
async def api_skip_task(
    id: int,
    uow: TaskUoWDep,
    auth: TokenAuthDep,
    team_provider: TeamProviderDep,
) -> TaskDTO:
    uid = auth.request.state.user.id
    return await start_task(id, uid, uow, team_provider)


@ratings_api_router.get("/", response_model=RatingsListDTO)
async def api_get_ratings() -> RatingsListDTO:
    raise NotImplementedError


@ratings_api_router.get("/{id}", response_model=RatingDetailDTO)
async def api_get_rating(id: int) -> RatingDetailDTO:
    raise NotImplementedError


@modules_api_router.get("/{id}/rating", response_model=RatingDetailDTO)
async def api_module_get_rating(id: int) -> RatingDetailDTO:
    raise NotImplementedError
