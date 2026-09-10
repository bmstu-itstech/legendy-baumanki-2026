from src.profile.domain.dtos import TeamUpdateDTO, TeamWithMembersDTO
from src.profile.domain.entities import TeamUpdate
from src.profile.domain.exception import UserIsNotTeamLeader
from src.profile.domain.interfaces.profile_uow import IProfileUnitOfWork


async def update_team(
    actor_id: int,
    team_dto: TeamUpdateDTO,
    uow: IProfileUnitOfWork,
) -> TeamWithMembersDTO:
    async with uow:
        team = await uow.teams.get_profile_team_or_none(actor_id)
        if not team:
            raise UserIsNotTeamLeader()
        if team.leader.user_id != actor_id:
            raise UserIsNotTeamLeader()
        team.name = team_dto.name
        await uow.teams.update_team(
            TeamUpdate(
                **team_dto.model_dump(mode="json"),
            )
        )
    return TeamWithMembersDTO.from_domain(team)
