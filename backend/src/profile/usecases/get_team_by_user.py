from src.profile.domain.dtos import TeamWithMembersDTO
from src.profile.domain.exception import UserIsNotInTeam
from src.profile.domain.interfaces.email_provider import IEmailProvider
from src.profile.domain.interfaces.profile_uow import IProfileUnitOfWork


async def get_team_by_user(
    user_id: int,
    uow: IProfileUnitOfWork,
    email_provider: IEmailProvider,
) -> TeamWithMembersDTO:
    async with uow:
        team = await uow.teams.get_profile_team_or_none(user_id)
    if not team:
        raise UserIsNotInTeam()

    member_ids = {team.leader.user_id, *(member.user_id for member in team.members)}
    emails = {uid: await email_provider.get_user_email(uid) for uid in member_ids}

    return TeamWithMembersDTO.from_domain(team, emails)
