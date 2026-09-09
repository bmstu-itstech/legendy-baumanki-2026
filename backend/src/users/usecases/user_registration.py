from src.core.domain.interfaces.password_hasher import IPasswordHasher
from src.users.domain.dtos import UserCreateDTO
from src.users.domain.entities import User, UserCreate
from src.users.domain.interfaces.user_uow import IUserUnitOfWork


async def register_user(
    user_data: UserCreateDTO,
    pwd_hasher: IPasswordHasher,
    uow: IUserUnitOfWork,
) -> User:
    user_data = UserCreate(
        passhash=pwd_hasher.hash(user_data.password),
        **user_data.model_dump(mode="json"),
    )
    async with uow:
        new_user = await uow.users.create(user_data)
        await uow.commit()
    return new_user
