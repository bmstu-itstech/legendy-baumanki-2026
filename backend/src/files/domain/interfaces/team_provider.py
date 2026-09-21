import abc


class ITeamProvider(abc.ABC):
    @abc.abstractmethod
    async def get_team_id(self, user_id: int) -> int | None:
        """Возвращает id команды пользователя, или None, если он не состоит в команде."""
