from src.auth.domain.dtos import UserCreateDTO
from src.auth.domain.entities import User, UserCreate
from src.auth.domain.interfaces.user_uow import IUserUnitOfWork
from src.core.domain.interfaces.password_hasher import IPasswordHasher


async def register_user(
    user_data: UserCreateDTO,
    pwd_hasher: IPasswordHasher,
    uow: IUserUnitOfWork,
) -> User:
    user_data = UserCreate(
        passhash=pwd_hasher.hash(user_data.password.get_secret_value()),
        **user_data.model_dump(mode="json"),
    )
    async with uow:
        new_user = await uow.users.create(user_data)
        await uow.commit()
    return new_user
