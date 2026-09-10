from src.profile.domain.dtos import TeamWithMembersDTO
from src.profile.domain.entities import ProfileUpdate
from src.profile.domain.exception import UserAlreadyInTeam
from src.profile.domain.interfaces.email_provider import IEmailProvider
from src.profile.domain.interfaces.profile_uow import IProfileUnitOfWork


async def join_team(
    user_id: int,
    team_code: str,
    uow: IProfileUnitOfWork,
    email_provider: IEmailProvider,
) -> TeamWithMembersDTO:
    async with uow:
        profile = await uow.profiles.get_by_id(user_id)
        if profile.team_id is not None:
            raise UserAlreadyInTeam()
        team = await uow.teams.get_team_by_code(team_code)
        # Валидирует вместимость (TeamIsFull) — members тут только для этой
        # проверки, персистится членство через profiles.team_id, а не через
        # TeamModel.members (это обратная связь, не колонка).
        team.join(profile.user_id)
        await uow.profiles.update(ProfileUpdate(user_id=user_id, team_id=team.id))
        await uow.commit()

        team_with_members = await uow.teams.get_profile_team_or_none(user_id)

    member_ids = {
        team_with_members.leader.user_id,
        *(member.user_id for member in team_with_members.members),
    }
    emails = {uid: await email_provider.get_user_email(uid) for uid in member_ids}
    return TeamWithMembersDTO.from_domain(team_with_members, emails)
