from src.files.domain.interfaces.team_provider import ITeamProvider
from src.profile.infra.db.uow import PGProfileUnitOfWork


class PGTeamProvider(ITeamProvider):
    async def get_team_id(self, user_id: int) -> int | None:
        async with PGProfileUnitOfWork() as uow:
            team = await uow.teams.get_profile_team_or_none(user_id)
            return team.id if team else None
