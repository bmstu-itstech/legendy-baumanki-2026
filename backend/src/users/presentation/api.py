from fastapi import APIRouter
from src.users.domain.dtos import UserCreatedDTO, UserCreateDTO
from src.users.presentation.dependencies import PasswordHasherDep, UserUoWDep
from src.users.usecases.user_registration import register_user

users_api_router = APIRouter()


@users_api_router.post("", response_model=UserCreatedDTO)
async def register(
    user_data: UserCreateDTO,
    pwd_hasher: PasswordHasherDep,
    uow: UserUoWDep,
):
    return await register_user(user_data, pwd_hasher, uow)
