from typing import Self

from sqlalchemy.ext.asyncio import AsyncSession
from src.db.engine import async_session_maker
from src.profile.domain.interfaces.profile_uow import IProfileUnitOfWork
from src.profile.infra.db.repositories import PGProfileRepository, PGTeamRepository


class PGProfileUnitOfWork(IProfileUnitOfWork):
    def __init__(self, session_factory=async_session_maker):
        self.session_factory = session_factory

    async def __aenter__(self) -> Self:
        self.session: AsyncSession = self.session_factory()
        self.profiles = PGProfileRepository(self.session)
        self.teams = PGTeamRepository(self.session)
        return await super().__aenter__()

    async def __aexit__(self, *args):
        await super().__aexit__(*args)
        await self.session.close()

    async def rollback(self):
        await self.session.rollback()

    async def _commit(self):
        await self.session.commit()
