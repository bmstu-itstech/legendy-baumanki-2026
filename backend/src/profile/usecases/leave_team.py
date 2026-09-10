from src.profile.domain.entities import TeamUpdate
from src.profile.domain.exception import UserIsNotInTeam
from src.profile.domain.interfaces.profile_uow import IProfileUnitOfWork


async def leave_team(
    user_id: int,
    uow: IProfileUnitOfWork,
) -> None:
    async with uow:
        team = await uow.teams.get_profile_team_or_none(user_id)
        if team is None:
            raise UserIsNotInTeam()
        team = team.downgrade()
        team.kick(user_id)
        await uow.teams.update_team(
            TeamUpdate(
                **team.model_dump(mode="json"),
            )
        )
