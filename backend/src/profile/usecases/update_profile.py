from src.profile.domain.dtos import ProfileReadDTO, ProfileUpdateDTO
from src.profile.domain.entities import ProfileUpdate
from src.profile.domain.interfaces.email_provider import IEmailProvider
from src.profile.domain.interfaces.profile_uow import IProfileUnitOfWork


async def update_profile(
    user_id: int,
    profile_dto: ProfileUpdateDTO,
    uow: IProfileUnitOfWork,
    email_provider: IEmailProvider,
) -> ProfileReadDTO:
    async with uow:
        profile_data = ProfileUpdate(
            user_id=user_id,
            **profile_dto.model_dump(exclude_unset=True),
        )
        profile = await uow.profiles.update(profile_data)
        await uow.commit()
    email = await email_provider.get_user_email(profile.user_id)
    return ProfileReadDTO(
        **profile.model_dump(mode="json"),
        email=email,
    )
