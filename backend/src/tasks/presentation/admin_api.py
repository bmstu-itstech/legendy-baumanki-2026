from fastapi import APIRouter, Depends
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
from src.tasks.presentation.admin_dependencies import AdminContentUoWDep
from src.tasks.presentation.dependencies import TaskUoWDep
from src.tasks.usecases import resolve_review
from starlette import status

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
    data: AdminModuleUpsertDTO, uow: AdminContentUoWDep
) -> AdminModuleDTO:
    async with uow:
        module = await uow.content.create_module(data)
        await uow.commit()
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
) -> AdminModuleDTO:
    async with uow:
        module = await uow.content.update_module(module_id, data)
        await uow.commit()
    return module


@admin_content_api_router.delete(
    "/modules/{module_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def api_admin_delete_module(module_id: int, uow: AdminContentUoWDep) -> None:
    async with uow:
        await uow.content.delete_module(module_id)
        await uow.commit()


@admin_content_api_router.post(
    "/modules/{module_id}/sections", response_model=AdminSectionDTO
)
async def api_admin_create_section(
    module_id: int,
    data: AdminSectionUpsertDTO,
    uow: AdminContentUoWDep,
) -> AdminSectionDTO:
    async with uow:
        section = await uow.content.create_section(module_id, data)
        await uow.commit()
    return section


@admin_content_api_router.patch(
    "/modules/{module_id}/sections/{number}", response_model=AdminSectionDTO
)
async def api_admin_update_section(
    module_id: int,
    number: int,
    data: AdminSectionUpsertDTO,
    uow: AdminContentUoWDep,
) -> AdminSectionDTO:
    async with uow:
        section = await uow.content.update_section(module_id, number, data)
        await uow.commit()
    return section


@admin_content_api_router.delete(
    "/modules/{module_id}/sections/{number}", status_code=status.HTTP_204_NO_CONTENT
)
async def api_admin_delete_section(
    module_id: int, number: int, uow: AdminContentUoWDep
) -> None:
    async with uow:
        await uow.content.delete_section(module_id, number)
        await uow.commit()


@admin_content_api_router.get("/tasks/{task_id}", response_model=AdminTaskDTO)
async def api_admin_get_task(task_id: int, uow: AdminContentUoWDep) -> AdminTaskDTO:
    async with uow:
        return await uow.content.get_task(task_id)


@admin_content_api_router.post("/tasks", response_model=AdminTaskDTO)
async def api_admin_create_task(
    data: AdminTaskUpsertDTO, uow: AdminContentUoWDep
) -> AdminTaskDTO:
    async with uow:
        task = await uow.content.create_task(data)
        await uow.commit()
    return task


@admin_content_api_router.patch("/tasks/{task_id}", response_model=AdminTaskDTO)
async def api_admin_update_task(
    task_id: int, data: AdminTaskUpsertDTO, uow: AdminContentUoWDep
) -> AdminTaskDTO:
    async with uow:
        task = await uow.content.update_task(task_id, data)
        await uow.commit()
    return task


@admin_content_api_router.delete(
    "/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def api_admin_delete_task(task_id: int, uow: AdminContentUoWDep) -> None:
    async with uow:
        await uow.content.delete_task(task_id)
        await uow.commit()


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
) -> TaskDTO:
    return await resolve_review(team_id, task_id, data.approve, uow)
