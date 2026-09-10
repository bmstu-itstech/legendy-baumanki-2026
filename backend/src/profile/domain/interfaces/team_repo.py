import abc

from src.profile.domain.entities import Team, TeamCreate, TeamUpdate, TeamWithMembers


class ITeamRepository(abc.ABC):
    @abc.abstractmethod
    async def create_team(self, team_data: TeamCreate) -> Team:
        """Создаёт новую команду"""

    @abc.abstractmethod
    async def get_team_by_id(self, team_id: int) -> Team:
        """Возвращает команду по её ID"""

    @abc.abstractmethod
    async def get_team_by_code(self, code: str) -> Team:
        """Возвращает команду по её публичному коду"""

    @abc.abstractmethod
    async def get_profile_team_or_none(self, member_id: int) -> TeamWithMembers | None:
        """
        Возвращает команду, в которой состоит пользователь, или None,
        если в команде не состоит.
        """

    @abc.abstractmethod
    async def update_team(self, team_data: TeamUpdate) -> None:
        """Обновляет команду в репозитории"""

    @abc.abstractmethod
    async def delete_team(self, team_id: int) -> None:
        """Удаляет команду"""
