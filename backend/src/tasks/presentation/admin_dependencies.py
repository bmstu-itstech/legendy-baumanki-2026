from typing import Annotated

from fastapi import Depends
from src.tasks.domain.interfaces.admin_uow import IAdminContentUnitOfWork
from src.tasks.infra.db.admin_uow import PGAdminContentUnitOfWork


def get_admin_content_uow() -> IAdminContentUnitOfWork:
    return PGAdminContentUnitOfWork()


AdminContentUoWDep = Annotated[IAdminContentUnitOfWork, Depends(get_admin_content_uow)]
