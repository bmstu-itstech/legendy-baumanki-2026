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

        # Членство живёт в profiles.team_id (обратная связь), а не в
        # TeamModel.members — команду там ничего не хранит напрямую.
        await uow.profiles.update(ProfileUpdate(user_id=user_id, team_id=None))

        if team.leader.user_id == user_id:
            other_members = [m.user_id for m in team.members if m.user_id != user_id]
            if other_members:
                # Капитан уходит — передаём капитанство следующему участнику.
                await uow.teams.update_team(
                    TeamUpdate(id=team.id, leader_id=other_members[0])
                )
            else:
                # Капитан был последним участником — команду больше некому
                # представлять, распускаем её.
                await uow.teams.delete_team(team.id)

        await uow.commit()
