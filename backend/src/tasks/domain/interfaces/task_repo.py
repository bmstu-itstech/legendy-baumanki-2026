import abc

from src.tasks.domain.entities import Module, ModuleDetails, Task, TaskUpdate


class ITaskRepository(abc.ABC):
    @abc.abstractmethod
    async def get_all(self, team_id: int) -> list[Module]:
        """Возвращает все модули в порядке их ID"""

    @abc.abstractmethod
    async def get_by_id(self, team_id: int, module_id: int) -> ModuleDetails:
        """Возвращает модуль со всеми его заданиями"""

    @abc.abstractmethod
    async def get_task_by_id(self, team_id: int, task_id: int) -> Task:
        """Возвращает задание по его ID"""

    @abc.abstractmethod
    async def update_task(self, team_id: int, task: TaskUpdate) -> Task:
        """Обновляет состояние задания для команды"""
