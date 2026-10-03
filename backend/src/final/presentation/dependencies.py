from typing import Annotated

from fastapi import Depends

from src.final.domain.interfaces.final_uow import IFinalUnitOfWork
from src.final.domain.interfaces.team_provider import ITeamProvider
from src.final.infra.db.uow import PGFinalUnitOfWork
from src.final.infra.services.pg_team_provider import PGTeamProvider


def get_final_uow() -> IFinalUnitOfWork:
    return PGFinalUnitOfWork()


def get_team_provider() -> ITeamProvider:
    return PGTeamProvider()


FinalUoWDep = Annotated[IFinalUnitOfWork, Depends(get_final_uow)]
TeamProviderDep = Annotated[ITeamProvider, Depends(get_team_provider)]
