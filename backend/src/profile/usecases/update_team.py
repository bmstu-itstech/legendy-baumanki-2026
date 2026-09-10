from src.profile.domain.dtos import TeamUpdateDTO, TeamWithMembersDTO
from src.profile.domain.entities import TeamUpdate
from src.profile.domain.exception import UserIsNotTeamLeader
from src.profile.domain.interfaces.email_provider import IEmailProvider
from src.profile.domain.interfaces.profile_uow import IProfileUnitOfWork


async def update_team(
    actor_id: int,
    team_dto: TeamUpdateDTO,
    uow: IProfileUnitOfWork,
    email_provider: IEmailProvider,
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
                id=team.id,
                **team_dto.model_dump(mode="json"),
            )
        )
        await uow.commit()

    member_ids = {team.leader.user_id, *(member.user_id for member in team.members)}
    emails = {uid: await email_provider.get_user_email(uid) for uid in member_ids}

    return TeamWithMembersDTO.from_domain(team, emails)
