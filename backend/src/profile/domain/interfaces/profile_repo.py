import abc

from src.profile.domain.entities import Profile, ProfileCreate, ProfileUpdate


class IProfileRepository(abc.ABC):
    @abc.abstractmethod
    async def create(self, profile: ProfileCreate) -> Profile:
        """Создаёт новый профиль для существующего пользователя"""

    @abc.abstractmethod
    async def get_by_id(self, user_id: int) -> Profile:
        """Получить профиль человека по его идентификатору"""

    @abc.abstractmethod
    async def update(self, profile: ProfileUpdate) -> Profile:
        """Обновить профиль человека"""
