from typing import Annotated

from fastapi import Depends
from src.profile.config import settings
from src.profile.domain.interfaces.email_provider import IEmailProvider
from src.profile.domain.interfaces.profile_uow import IProfileUnitOfWork
from src.profile.domain.interfaces.team_code_provider import ITeamCodeProvider
from src.profile.infra.db.uow import PGProfileUnitOfWork
from src.profile.infra.services.rand_team_code_provider import RandTeamCodeProvider
from src.profile.infra.services.stub_email_provider import StubEmailProvider


def get_profile_uow() -> IProfileUnitOfWork:
    return PGProfileUnitOfWork()


def get_email_provider() -> IEmailProvider:
    return StubEmailProvider()


def get_team_code_provider() -> ITeamCodeProvider:
    return RandTeamCodeProvider(settings.TEAM_CODE_LENGTH)


ProfileUoWDep = Annotated[IProfileUnitOfWork, Depends(get_profile_uow)]
EmailProviderDep = Annotated[IEmailProvider, Depends(get_email_provider)]
TeamCodeProviderDep = Annotated[ITeamCodeProvider, Depends(get_team_code_provider)]
