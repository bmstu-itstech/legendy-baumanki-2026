import abc

from src.users.domain.interfaces.user_repo import IUserRepository


class IUserUnitOfWork(abc.ABC):
    """
    UoW интерфейс для работы с операциями, связанными с пользователями.

    Интерфейс определяет границы транзакций для операций с репозиторием
    пользователя. Это гарантирует атомарность операций над пользователями.
    """

    users: IUserRepository

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
