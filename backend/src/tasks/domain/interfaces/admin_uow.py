import abc

from src.tasks.domain.interfaces.admin_repo import IAdminContentRepository


class IAdminContentUnitOfWork(abc.ABC):
    """UoW для контента организатора — границы транзакций как у ITaskUnitOfWork."""

    content: IAdminContentRepository

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        await self.rollback()

    async def commit(self):
        await self._commit()

    @abc.abstractmethod
    async def rollback(self): ...

    @abc.abstractmethod
    async def _commit(self): ...
