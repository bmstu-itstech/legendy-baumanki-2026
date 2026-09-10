from src.profile.domain.entities import TeamUpdate
from src.profile.domain.exception import UserAlreadyInTeam
from src.profile.domain.interfaces.profile_uow import IProfileUnitOfWork


async def join_team(
    user_id: int,
    team_code: str,
    uow: IProfileUnitOfWork,
) -> None:
    async with uow:
        profile = await uow.profiles.get_by_id(user_id)
        if profile.team_id is not None:
            raise UserAlreadyInTeam()
        team = await uow.teams.get_team_by_code(team_code)
        team.join(profile.user_id)
        await uow.teams.update_team(
            TeamUpdate(
                **team.model_dump(mode="json"),
            )
        )
