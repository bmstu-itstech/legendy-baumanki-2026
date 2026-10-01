import logging
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from starlette import status

from src.auth.presentation.permissions import require_superuser
from src.tasks.domain.admin_dtos import (
    AdminModuleContentDTO,
    AdminModuleDTO,
    AdminModuleListDTO,
    AdminModuleUpsertDTO,
    AdminReviewListDTO,
    AdminReviewResolveDTO,
    AdminSectionDTO,
    AdminSectionUpsertDTO,
    AdminTaskDTO,
    AdminTaskUpsertDTO,
)
from src.tasks.domain.dtos import TaskDTO
from src.tasks.domain.interfaces.admin_uow import IAdminContentUnitOfWork
from src.tasks.presentation.admin_dependencies import AdminContentUoWDep
from src.tasks.presentation.dependencies import TaskUoWDep
from src.tasks.usecases import resolve_review

admin_logger = logging.getLogger("admin")

# Значения этих полей в лог не пишем, только факт изменения: тексты длинные,
# а в questions лежат правильные ответы — им не место в логах.
_OPAQUE_FIELDS = frozenset({"desc", "explanation", "questions", "media"})


def get_actor_id(request: Request) -> int:
    # Роутер уже требует суперюзера, так что пользователь здесь всегда есть.
    return request.state.user.id


ActorIdDep = Annotated[int, Depends(get_actor_id)]


def _snapshot(dto: BaseModel) -> dict[str, Any]:
    return {
        k: v
        for k, v in dto.model_dump(mode="json").items()
        if k not in _OPAQUE_FIELDS
    }


def _diff(before: BaseModel | None, after: BaseModel) -> dict[str, Any]:
    old = before.model_dump(mode="json") if before else {}
    return {
        k: "changed" if k in _OPAQUE_FIELDS else {"from": old.get(k), "to": v}
        for k, v in after.model_dump(mode="json").items()
        if old.get(k) != v
    }


def _log_change(action: str, actor_id: int, **fields: Any) -> None:
    admin_logger.info("%s actor_id=%s %s", action, actor_id, fields)


# dependencies=[...] — авторизация всего роутера в одном месте: любой новый
# эндпоинт здесь автоматически требует суперюзера, даже если на конкретном
# хендлере забыли навесить проверку (в отличие от @access_control per-route).
admin_content_api_router = APIRouter(dependencies=[Depends(require_superuser)])


@admin_content_api_router.get("/modules", response_model=AdminModuleListDTO)
async def api_admin_list_modules(uow: AdminContentUoWDep) -> AdminModuleListDTO:
    async with uow:
        modules = await uow.content.list_modules()
    return AdminModuleListDTO(modules=modules)


@admin_content_api_router.post("/modules", response_model=AdminModuleDTO)
async def api_admin_create_module(
    data: AdminModuleUpsertDTO, uow: AdminContentUoWDep, actor_id: ActorIdDep
) -> AdminModuleDTO:
    async with uow:
        module = await uow.content.create_module(data)
        await uow.commit()
    _log_change("create_module", actor_id, module=_snapshot(module))
    return module


@admin_content_api_router.get(
    "/modules/{module_id}", response_model=AdminModuleContentDTO
)
async def api_admin_get_module(
    module_id: int, uow: AdminContentUoWDep
) -> AdminModuleContentDTO:
    async with uow:
        return await uow.content.get_module_content(module_id)


@admin_content_api_router.patch("/modules/{module_id}", response_model=AdminModuleDTO)
async def api_admin_update_module(
    module_id: int,
    data: AdminModuleUpsertDTO,
    uow: AdminContentUoWDep,
    actor_id: ActorIdDep,
) -> AdminModuleDTO:
    async with uow:
        before = (await uow.content.get_module_content(module_id)).module
        module = await uow.content.update_module(module_id, data)
        await uow.commit()
    _log_change(
        "update_module",
        actor_id,
        module_id=module_id,
        changes=_diff(before, module),
    )
    return module


@admin_content_api_router.delete(
    "/modules/{module_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def api_admin_delete_module(
    module_id: int, uow: AdminContentUoWDep, actor_id: ActorIdDep
) -> None:
    async with uow:
        before = (await uow.content.get_module_content(module_id)).module
        await uow.content.delete_module(module_id)
        await uow.commit()
    _log_change("delete_module", actor_id, module=_snapshot(before))


@admin_content_api_router.post(
    "/modules/{module_id}/sections", response_model=AdminSectionDTO
)
async def api_admin_create_section(
    module_id: int,
    data: AdminSectionUpsertDTO,
    uow: AdminContentUoWDep,
    actor_id: ActorIdDep,
) -> AdminSectionDTO:
    async with uow:
        section = await uow.content.create_section(module_id, data)
        await uow.commit()
    _log_change("create_section", actor_id, section=_snapshot(section))
    return section


async def _find_section(
    uow: IAdminContentUnitOfWork, module_id: int, number: int
) -> AdminSectionDTO | None:
    content = await uow.content.get_module_content(module_id)
    return next((s for s in content.sections if s.number == number), None)


@admin_content_api_router.patch(
    "/modules/{module_id}/sections/{number}", response_model=AdminSectionDTO
)
async def api_admin_update_section(
    module_id: int,
    number: int,
    data: AdminSectionUpsertDTO,
    uow: AdminContentUoWDep,
    actor_id: ActorIdDep,
) -> AdminSectionDTO:
    async with uow:
        before = await _find_section(uow, module_id, number)
        section = await uow.content.update_section(module_id, number, data)
        await uow.commit()
    _log_change(
        "update_section",
        actor_id,
        module_id=module_id,
        number=number,
        changes=_diff(before, section),
    )
    return section


@admin_content_api_router.delete(
    "/modules/{module_id}/sections/{number}", status_code=status.HTTP_204_NO_CONTENT
)
async def api_admin_delete_section(
    module_id: int, number: int, uow: AdminContentUoWDep, actor_id: ActorIdDep
) -> None:
    async with uow:
        before = await _find_section(uow, module_id, number)
        await uow.content.delete_section(module_id, number)
        await uow.commit()
    fallback = {"module_id": module_id, "number": number}
    _log_change(
        "delete_section",
        actor_id,
        section=_snapshot(before) if before else fallback,
    )


@admin_content_api_router.get("/tasks/{task_id}", response_model=AdminTaskDTO)
async def api_admin_get_task(task_id: int, uow: AdminContentUoWDep) -> AdminTaskDTO:
    async with uow:
        return await uow.content.get_task(task_id)


@admin_content_api_router.post("/tasks", response_model=AdminTaskDTO)
async def api_admin_create_task(
    data: AdminTaskUpsertDTO, uow: AdminContentUoWDep, actor_id: ActorIdDep
) -> AdminTaskDTO:
    async with uow:
        task = await uow.content.create_task(data)
        await uow.commit()
    _log_change("create_task", actor_id, task=_snapshot(task))
    return task


@admin_content_api_router.patch("/tasks/{task_id}", response_model=AdminTaskDTO)
async def api_admin_update_task(
    task_id: int,
    data: AdminTaskUpsertDTO,
    uow: AdminContentUoWDep,
    actor_id: ActorIdDep,
) -> AdminTaskDTO:
    async with uow:
        before = await uow.content.get_task(task_id)
        task = await uow.content.update_task(task_id, data)
        await uow.commit()
    _log_change(
        "update_task", actor_id, task_id=task_id, changes=_diff(before, task)
    )
    return task


@admin_content_api_router.delete(
    "/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def api_admin_delete_task(
    task_id: int, uow: AdminContentUoWDep, actor_id: ActorIdDep
) -> None:
    async with uow:
        before = await uow.content.get_task(task_id)
        await uow.content.delete_task(task_id)
        await uow.commit()
    _log_change("delete_task", actor_id, task=_snapshot(before))


@admin_content_api_router.get("/reviews", response_model=AdminReviewListDTO)
async def api_admin_list_reviews(uow: AdminContentUoWDep) -> AdminReviewListDTO:
    async with uow:
        items = await uow.content.list_pending_reviews()
    return AdminReviewListDTO(items=items)


@admin_content_api_router.post(
    "/reviews/{team_id}/{task_id}/resolve", response_model=TaskDTO
)
async def api_admin_resolve_review(
    team_id: int,
    task_id: int,
    data: AdminReviewResolveDTO,
    uow: TaskUoWDep,
    actor_id: ActorIdDep,
) -> TaskDTO:
    return await resolve_review(actor_id, team_id, task_id, data.approve, uow)
