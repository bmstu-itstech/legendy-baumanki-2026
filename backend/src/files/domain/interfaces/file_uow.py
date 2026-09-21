import abc

from src.files.domain.interfaces.file_repo import IFileRepository


class IFileUnitOfWork(abc.ABC):
    """
    UoW интерфейс для работы с файлами.

    Интерфейс определяет границы транзакций для операций с репозиторием.
    Это гарантирует атомарность операций над сущностями.
    """

    files: IFileRepository

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
