from typing import Self

from sqlalchemy.ext.asyncio import AsyncSession

from src.db.engine import async_session_maker
from src.final.domain.interfaces.final_uow import IFinalUnitOfWork
from src.final.infra.db.repository import PGFinalRepository


class PGFinalUnitOfWork(IFinalUnitOfWork):
    def __init__(self, session_factory=async_session_maker):
        self.session_factory = session_factory

    async def __aenter__(self) -> Self:
        self.session: AsyncSession = self.session_factory()
        self.final = PGFinalRepository(self.session)
        return await super().__aenter__()

    async def __aexit__(self, *args):
        await super().__aexit__(*args)
        await self.session.close()

    async def rollback(self):
        await self.session.rollback()

    async def _commit(self):
        await self.session.commit()
