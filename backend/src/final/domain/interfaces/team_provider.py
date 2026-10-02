import abc

from src.final.domain.entities import TeamInfo


class ITeamProvider(abc.ABC):
    @abc.abstractmethod
    async def get_team(self, user_id: int) -> TeamInfo | None:
        """Возвращает команду, в которой состоит пользователь, или None"""
