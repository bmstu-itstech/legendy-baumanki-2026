from src.core.logging import log_usecase
from src.profile.domain.dtos import AdminTeamDTO, AdminTeamMemberDTO
from src.profile.domain.interfaces.email_provider import IEmailProvider
from src.profile.domain.interfaces.profile_uow import IProfileUnitOfWork


@log_usecase
async def admin_get_team(
    team_id: int,
    uow: IProfileUnitOfWork,
    email_provider: IEmailProvider,
) -> AdminTeamDTO:
    async with uow:
        team = await uow.teams.get_team_with_members(team_id)
    # Капитан — первым, остальные по имени: так организатору проще искать.
    members = sorted(
        team.members,
        key=lambda m: (m.user_id != team.leader.user_id, m.full_name),
    )
    return AdminTeamDTO(
        id=team.id,
        public_code=team.public_code,
        name=team.name,
        leader_id=team.leader.user_id,
        created_at=team.created_at,
        members=[
            AdminTeamMemberDTO(
                user_id=m.user_id,
                full_name=m.full_name,
                group=m.group,
                telegram=m.telegram,
                email=await email_provider.get_user_email(m.user_id),
            )
            for m in members
        ],
    )
