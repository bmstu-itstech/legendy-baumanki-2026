from src.profile.domain.dtos import ProfileCreateDTO, ProfileReadDTO
from src.profile.domain.entities import ProfileCreate, TeamUpdate
from src.profile.domain.interfaces.email_provider import IEmailProvider
from src.profile.domain.interfaces.profile_uow import IProfileUnitOfWork


async def create_profile(
    profile_dto: ProfileCreateDTO,
    uow: IProfileUnitOfWork,
    email_provider: IEmailProvider,
) -> ProfileReadDTO:
    team_code = profile_dto.team_code
    profile_data = ProfileCreate(
        **profile_dto.model_dump(mode="json"),
    )
    async with uow:
        profile = await uow.profiles.create(profile_data)
        if team_code:
            team = await uow.teams.get_team_by_code(team_code)
            team.join(profile.user_id)
            await uow.teams.update_team(
                TeamUpdate(
                    **team.model_dump(mode="json"),
                )
            )
        profile = await uow.profiles.create(profile_data)
    email = await email_provider.get_user_email(profile.user_id)
    return ProfileReadDTO(
        **profile.model_dump(mode="json"),
        email=email,
    )
