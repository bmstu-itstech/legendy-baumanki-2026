from fastapi import APIRouter
from src.auth.domain.dtos import Credentials
from src.auth.domain.entities import AuthUser
from src.auth.presentation.dependencies import PasswordHasherDep, TokenAuthDep
from src.auth.usecases.authentication import authenticate
from src.core.domain.exceptions.exceptions import NotAuthenticated
from src.users.presentation.dependencies import UserUoWDep

auth_api_router = APIRouter()


@auth_api_router.post("/login")
async def login(
    credentials: Credentials,
    pwd_hasher: PasswordHasherDep,
    uow: UserUoWDep,
    auth: TokenAuthDep,
):
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
async def get_me(auth: TokenAuthDep) -> AuthUser:
    user = auth._request.state.user
    if not user:
        raise NotAuthenticated()
    return user
