import abc

from src.final.domain.interfaces.final_repo import IFinalRepository


class IFinalUnitOfWork(abc.ABC):
    """
    UoW интерфейс для работы с записью на финал.

    Интерфейс определяет границы транзакций для операций с репозиторием.
    Это гарантирует атомарность операций над сущностями.
    """

    final: IFinalRepository

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
        """
