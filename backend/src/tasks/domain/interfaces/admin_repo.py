import abc

from src.tasks.domain.admin_dtos import (
    AdminModuleContentDTO,
    AdminModuleDTO,
    AdminModuleUpsertDTO,
    AdminReviewItemDTO,
    AdminSectionDTO,
    AdminSectionUpsertDTO,
    AdminTaskDTO,
    AdminTaskUpsertDTO,
)


class IAdminContentRepository(abc.ABC):
    """Работа с контентом (модули/секции/задания) и модерацией от лица организатора."""

    @abc.abstractmethod
    async def list_modules(self) -> list[AdminModuleDTO]: ...

    @abc.abstractmethod
    async def create_module(self, data: AdminModuleUpsertDTO) -> AdminModuleDTO: ...

    @abc.abstractmethod
    async def update_module(
        self, module_id: int, data: AdminModuleUpsertDTO
    ) -> AdminModuleDTO: ...

    @abc.abstractmethod
    async def delete_module(self, module_id: int) -> None: ...

    @abc.abstractmethod
    async def get_module_content(self, module_id: int) -> AdminModuleContentDTO: ...

    @abc.abstractmethod
    async def create_section(
        self, module_id: int, data: AdminSectionUpsertDTO
    ) -> AdminSectionDTO: ...

    @abc.abstractmethod
    async def update_section(
        self, module_id: int, number: int, data: AdminSectionUpsertDTO
    ) -> AdminSectionDTO: ...

    @abc.abstractmethod
    async def delete_section(self, module_id: int, number: int) -> None: ...

    @abc.abstractmethod
    async def get_task(self, task_id: int) -> AdminTaskDTO: ...

    @abc.abstractmethod
    async def create_task(self, data: AdminTaskUpsertDTO) -> AdminTaskDTO: ...

    @abc.abstractmethod
    async def update_task(
        self, task_id: int, data: AdminTaskUpsertDTO
    ) -> AdminTaskDTO: ...

    @abc.abstractmethod
    async def delete_task(self, task_id: int) -> None: ...

    @abc.abstractmethod
    async def list_pending_reviews(self) -> list[AdminReviewItemDTO]: ...
