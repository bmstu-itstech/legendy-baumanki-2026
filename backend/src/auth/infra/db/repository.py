from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from src.auth.domain.entities import User, UserCreate
from src.auth.domain.exceptions import UserAlreadyExists, UserNotFound
from src.auth.domain.interfaces.user_repo import IUserRepository
from src.auth.infra.db.orm import UserModel


class PGUserRepository(IUserRepository):
    def __init__(self, session: AsyncSession):
        super().__init__()
        self.session = session

    async def create(self, user: UserCreate) -> User:
        obj = UserModel(**user.model_dump())
        self.session.add(obj)
        try:
            await self.session.flush()
        except IntegrityError as e:
            try:
                detail = "User can't be created. " + str(e.orig).split("\nDETAIL:  ")[1]
            except IndexError:
                detail = "User can't be created due to integrity error."
            raise UserAlreadyExists(detail=detail)
        return self._to_domain(obj)

    async def get_by_id(self, user_id: int) -> User:
        stmt = select(UserModel).where(UserModel.id == user_id)
        result = await self.session.execute(stmt)
        obj: UserModel | None = result.scalar_one_or_none()
        if not obj:
            raise UserNotFound(detail=f"User with id {user_id} not found")
        return self._to_domain(obj)

    async def get_by_email(self, email: str) -> User:
        stmt = select(UserModel).where(UserModel.email == email)
        result = await self.session.execute(stmt)
        obj: UserModel | None = result.scalar_one_or_none()
        if not obj:
            raise UserNotFound(detail=f"User with email {email} not found")
        return self._to_domain(obj)

    @staticmethod
    def _to_domain(obj: UserModel) -> User:
        return User(
            id=obj.id,
            email=obj.email,
            passhash=obj.passhash,
            is_superuser=obj.is_superuser,
            utm_source=obj.utm_source,
            utm_campaign=obj.utm_campaign,
            created_at=obj.created_at,
            updated_at=obj.updated_at,
        )
