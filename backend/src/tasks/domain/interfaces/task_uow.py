import abc

from src.tasks.domain.interfaces.task_repo import ITaskRepository


class ITaskUnitOfWork(abc.ABC):
    """
    UoW интерфейс для работы с операциями, связанными с заданиями.

    Интерфейс определяет границы транзакций для операций с репозиторием.
    Это гарантирует атомарность операций над сущностями.
    """

    tasks: ITaskRepository

    async def __aenter__(self):
        """
        Вход в контекст UoW.

        :return: Инстанс UoW.
        """
        return self

    async def __aexit__(self, *args):
        """
        Выходит из контекста UoW, откатывает все незакомиченные изменения.
        """
        await self.rollback()

    async def commit(self):
        """
        Коммитит все изменения, которые находятся в UoW.
        """
        await self._commit()

    @abc.abstractmethod
    async def rollback(self):
        """
        Явно откатывает все изменения в UoW.
        """

    @abc.abstractmethod
    async def _commit(self):
        """
        Внутренняя реализация commit().

        Зачем? Спросите что попроще, я уже не помню...
        """
