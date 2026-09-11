from src.profile.domain.entities import ProfileUpdate, TeamUpdate
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
        await uow.profiles.update(
            ProfileUpdate(
                user_id=user_id,
                team_id=None,
            )
        )
        team = team.downgrade()
        team.kick(user_id)
        if len(team.members) == 0:
            await uow.teams.delete_team(team.id)
        else:
            await uow.teams.update_team(TeamUpdate(**team.model_dump(mode="json")))
        await uow.commit()
