from src.final.domain.entities import TeamInfo
from src.final.domain.interfaces.team_provider import ITeamProvider
from src.profile.infra.db.uow import PGProfileUnitOfWork


class PGTeamProvider(ITeamProvider):
    async def get_team(self, user_id: int) -> TeamInfo | None:
        async with PGProfileUnitOfWork() as uow:
            team = await uow.teams.get_profile_team_or_none(user_id)
            if not team:
                return None
            return TeamInfo(
                id=team.id, leader_id=team.leader.user_id, size=len(team.members)
            )
