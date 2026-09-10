from typing import Annotated

from fastapi import Depends
from src.profile.domain.interfaces.email_provider import IEmailProvider
from src.profile.domain.interfaces.profile_uow import IProfileUnitOfWork
from src.profile.domain.interfaces.team_code_provider import ITeamCodeProvider


def get_profile_uow() -> IProfileUnitOfWork:
    raise NotImplementedError()


def get_email_provider() -> IEmailProvider:
    raise NotImplementedError()


def get_team_code_provider() -> ITeamCodeProvider:
    raise NotImplementedError()


ProfileUoWDep = Annotated[IProfileUnitOfWork, Depends(get_profile_uow)]
EmailProviderDep = Annotated[IEmailProvider, Depends(get_email_provider)]
TeamCodeProviderDep = Annotated[ITeamCodeProvider, Depends(get_team_code_provider)]
