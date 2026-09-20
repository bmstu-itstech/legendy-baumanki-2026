from typing import Annotated

from fastapi import Depends
from src.tasks.domain.interfaces.task_uow import ITaskUnitOfWork
from src.tasks.domain.interfaces.team_provider import ITeamProvider
from src.tasks.infra.db.uow import PGTaskUnitOfWork
from src.tasks.infra.services.pg_team_provider import PGTeamProvider


def get_task_uow() -> ITaskUnitOfWork:
    return PGTaskUnitOfWork()


def get_team_provider() -> ITeamProvider:
    return PGTeamProvider()


TaskUoWDep = Annotated[ITaskUnitOfWork, Depends(get_task_uow)]
TeamProviderDep = Annotated[ITeamProvider, Depends(get_team_provider)]
