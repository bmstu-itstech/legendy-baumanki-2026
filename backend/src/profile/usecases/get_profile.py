from src.core.logging import log_usecase
from src.profile.domain.dtos import ProfileReadDTO
from src.profile.domain.interfaces.email_provider import IEmailProvider
from src.profile.domain.interfaces.profile_uow import IProfileUnitOfWork


@log_usecase
async def get_profile(
    user_id: int,
    uow: IProfileUnitOfWork,
    email_provider: IEmailProvider,
) -> ProfileReadDTO:
    async with uow:
        profile = await uow.profiles.get_by_id(user_id)
    email = await email_provider.get_user_email(user_id)
    return ProfileReadDTO(
        **profile.model_dump(mode="json"),
        email=email,
    )
