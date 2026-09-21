from fastapi import APIRouter
from src.auth.domain.dtos import Credentials, UserCreatedDTO, UserCreateDTO
from src.auth.domain.entities import AuthenticatedUser
from src.auth.presentation.dependencies import (
    PasswordHasherDep,
    TokenAuthDep,
    UserUoWDep,
)
from src.auth.presentation.rate_limit import (
    enforce_login_rate_limit,
    enforce_register_rate_limit,
)
from src.auth.usecases import authenticate, register_user
from src.core.domain.exceptions.exceptions import NotAuthenticated

auth_api_router = APIRouter()


@auth_api_router.post("/register", response_model=UserCreatedDTO)
async def register(
    user_data: UserCreateDTO,
    pwd_hasher: PasswordHasherDep,
    uow: UserUoWDep,
    auth: TokenAuthDep,
):
    enforce_register_rate_limit(auth.request)
    return await register_user(user_data, pwd_hasher, uow, auth)


@auth_api_router.post("/login")
async def login(
    credentials: Credentials,
    pwd_hasher: PasswordHasherDep,
    uow: UserUoWDep,
    auth: TokenAuthDep,
):
    enforce_login_rate_limit(auth.request, credentials.email)
    await authenticate(
        credentials.email,
        credentials.password.get_secret_value(),
        pwd_hasher,
        uow,
        auth,
    )
    return {"detail": "Tokens set"}


@auth_api_router.post("/logout")
async def logout(auth: TokenAuthDep):
    await auth.unset_tokens()
    return {"detail": "Tokens deleted"}


@auth_api_router.get("/me")
# @access_control(open=True)
async def get_me(auth: TokenAuthDep) -> AuthenticatedUser:
    user = auth.request.state.user
    if not user or not user.id:
        raise NotAuthenticated()
    return user
