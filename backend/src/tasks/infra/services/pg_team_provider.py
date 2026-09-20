from src.profile.infra.db.uow import PGProfileUnitOfWork
from src.tasks.domain.entities import TeamInfo
from src.tasks.domain.interfaces.team_provider import ITeamProvider


class PGTeamProvider(ITeamProvider):
    async def get_team_id(self, user_id: int) -> TeamInfo | None:
        async with PGProfileUnitOfWork() as uow:
            team = await uow.teams.get_profile_team_or_none(user_id)
            if not team:
                return None
            return TeamInfo(
                id=team.id,
                size=len(team.members),
            )
