from src.profile.domain.dtos import TeamMemberDTO, TeamWithMembersDTO
from src.profile.domain.exception import UserIsNotInTeam
from src.profile.domain.interfaces.profile_uow import IProfileUnitOfWork


async def get_team_by_user(
    user_id: int,
    uow: IProfileUnitOfWork,
) -> TeamWithMembersDTO:
    async with uow:
        team = await uow.teams.get_profile_team_or_none(user_id)
    if not team:
        raise UserIsNotInTeam()
    return TeamWithMembersDTO(
        id=team.id,
        public_code=team.public_code,
        name=team.name,
        leader=TeamMemberDTO.from_profile(team.leader),
        members=[TeamMemberDTO.from_profile(member) for member in team.members],
    )
