from src.auth.domain.dtos import UserCreateDTO
from src.auth.domain.entities import AuthenticatedUser, User, UserCreate
from src.auth.domain.interfaces.token_auth import ITokenAuth
from src.auth.domain.interfaces.user_uow import IUserUnitOfWork
from src.core.domain.interfaces.password_hasher import IPasswordHasher


async def register_user(
    user_data: UserCreateDTO,
    pwd_hasher: IPasswordHasher,
    uow: IUserUnitOfWork,
    auth: ITokenAuth,
) -> User:
    user_data = UserCreate(
        passhash=pwd_hasher.hash(user_data.password.get_secret_value()),
        **user_data.model_dump(mode="json"),
    )
    async with uow:
        new_user = await uow.users.create(user_data)
        await uow.commit()

    # Регистрация сразу авторизует пользователя (см. комментарий во
    # frontend/lib/api/client.ts) — отдельный /auth/login после register
    # не нужен.
    await auth.set_tokens(
        AuthenticatedUser(id=new_user.id, is_superuser=new_user.is_superuser)
    )
    return new_user
