import abc

from src.tasks.domain.entities import TeamInfo


class ITeamProvider(abc.ABC):
    @abc.abstractmethod
    async def get_team_id(self, user_id: int) -> TeamInfo | None:
        """Возвращает информацию о команде, в которой состоит пользователь, или None"""
