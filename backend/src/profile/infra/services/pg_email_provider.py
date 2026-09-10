from src.auth.domain.exceptions import UserNotFound
from src.auth.infra.db.uow import PGUserUnitOfWork
from src.profile.domain.interfaces.email_provider import IEmailProvider


class PGEmailProvider(IEmailProvider):
    """Читает email напрямую из таблицы users auth-модуля (общая БД)."""

    async def get_user_email(self, user_id: int) -> str:
        async with PGUserUnitOfWork() as uow:
            try:
                user = await uow.users.get_by_id(user_id)
            except UserNotFound:
                return ""
            return user.email
