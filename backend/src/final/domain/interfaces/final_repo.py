import abc

from src.final.domain.entities import FinalBooking, FinalSlot, FinalTeam


class IFinalRepository(abc.ABC):
    @abc.abstractmethod
    async def get_slots(self) -> list[FinalSlot]:
        """Возвращает все слоты финала по возрастанию времени начала"""

    @abc.abstractmethod
    async def lock_slot(self, slot_id: int) -> FinalSlot:
        """
        Блокирует слот до конца транзакции и возвращает его с актуальным
        числом записей — так две команды не займут последнее место разом.
        """

    @abc.abstractmethod
    async def get_team_slot_id(self, team_id: int) -> int | None:
        """Возвращает слот, на который записана команда, или None"""

    @abc.abstractmethod
    async def create_booking(self, team_id: int, slot_id: int) -> None:
        """Записывает команду на слот"""

    @abc.abstractmethod
    async def delete_booking(self, team_id: int) -> bool:
        """Отменяет запись команды. False — записи не было"""

    @abc.abstractmethod
    async def delete_slot_booking(self, slot_id: int, team_id: int) -> bool:
        """Снимает команду с конкретного слота. False — её там не было"""

    @abc.abstractmethod
    async def team_exists(self, team_id: int) -> bool:
        """Есть ли команда с таким ID"""

    @abc.abstractmethod
    async def get_bookings(self) -> list[FinalBooking]:
        """Все записи с данными команд — для админки"""

    @abc.abstractmethod
    async def get_unbooked_teams(self) -> list[FinalTeam]:
        """Команды, которые ещё не записаны ни на один слот"""
