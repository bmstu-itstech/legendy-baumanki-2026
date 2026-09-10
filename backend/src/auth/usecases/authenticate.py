from src.auth.domain.entities import AuthenticatedUser, User
from src.auth.domain.exceptions import InvalidCredentials
from src.auth.domain.interfaces.token_auth import ITokenAuth
from src.auth.domain.interfaces.user_uow import IUserUnitOfWork
from src.core.domain.interfaces.password_hasher import IPasswordHasher


async def authenticate(
    email: str,
    password: str,
    pwd_hasher: IPasswordHasher,
    uow: IUserUnitOfWork,
    auth: ITokenAuth,
) -> User:
    async with uow:
        user = await uow.users.get_by_email(email)

        if not pwd_hasher.verify(password, user.passhash):
            raise InvalidCredentials()

        await auth.set_tokens(
            AuthenticatedUser(
                id=user.id,
                is_superuser=user.is_superuser,
            )
        )
        return user
