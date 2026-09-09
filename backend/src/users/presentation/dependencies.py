from typing import Annotated

from fastapi import Depends
from src.core.domain.interfaces.password_hasher import IPasswordHasher
from src.core.infra.services.bcrypt_password_hasher import BcryptPasswordHasher
from src.users.domain.interfaces.user_uow import IUserUnitOfWork
from src.users.infra.db.uow import PGUserUnitOfWork


def get_password_hasher() -> IPasswordHasher:
    return BcryptPasswordHasher()


def get_user_uow() -> IUserUnitOfWork:
    return PGUserUnitOfWork()


PasswordHasherDep = Annotated[IPasswordHasher, Depends(get_password_hasher)]
UserUoWDep = Annotated[IUserUnitOfWork, Depends(get_user_uow)]
