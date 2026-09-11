from src.profile.domain.dtos import TeamCreatedDTO, TeamCreateDTO
from src.profile.domain.entities import ProfileUpdate, TeamCreate
from src.profile.domain.exception import UserAlreadyInTeam
from src.profile.domain.interfaces.profile_uow import IProfileUnitOfWork
from src.profile.domain.interfaces.team_code_provider import ITeamCodeProvider


async def create_team(
    actor_id: int,
    team_dto: TeamCreateDTO,
    uow: IProfileUnitOfWork,
    code_provider: ITeamCodeProvider,
) -> TeamCreatedDTO:
    async with uow:
        actor = await uow.profiles.get_by_id(actor_id)
    if actor.team_id is not None:
        raise UserAlreadyInTeam()
    public_code = code_provider.generate_code()
    team_data = TeamCreate(
        **team_dto.model_dump(mode="json"),
        leader_id=actor_id,
        public_code=public_code,
    )
    async with uow:
        team = await uow.teams.create_team(team_data)
        await uow.profiles.update(
            ProfileUpdate(
                user_id=actor.user_id,
                team_id=team.id,
            )
        )
        await uow.commit()
    return TeamCreatedDTO(**team.model_dump(mode="json"))
