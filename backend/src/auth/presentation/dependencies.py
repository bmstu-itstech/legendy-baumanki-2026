from typing import Annotated

from fastapi import Depends
from src.auth.config import auth_config
from src.auth.domain.entities import TokenType
from src.auth.domain.interfaces.token_auth import ITokenAuth
from src.auth.domain.interfaces.token_storage import ITokenStorage
from src.auth.infra.services.inmemory_token_storage import InMemoryTokenStorage
from src.auth.infra.services.jwt import JWTAuth, JWTProvider
from src.auth.infra.transports.cookie import CookieTransport
from src.auth.infra.transports.header import HeaderTransport
from src.core.domain.interfaces.password_hasher import IPasswordHasher
from src.core.infra.services.bcrypt_password_hasher import BcryptPasswordHasher
from starlette.requests import Request
from starlette.responses import Response


def get_password_hasher() -> IPasswordHasher:
    return BcryptPasswordHasher()


def get_token_storage() -> ITokenStorage:
    return InMemoryTokenStorage()


async def get_token_auth(request: Request, response: Response = None) -> ITokenAuth:
    jwt_provider = JWTProvider()
    access_transports = [
        HeaderTransport(
            auth_config.JWT_ACCESS_HEADER_NAME, auth_config.JWT_HEADER_TYPE
        ),
    ]
    refresh_transports = [
        CookieTransport(
            cookie_name="refresh_token",
            cookie_max_age=auth_config.JWT_REFRESH_TOKEN_EXPIRE_SECONDS,
        ),
    ]
    transports = {
        TokenType.ACCESS: access_transports,
        TokenType.REFRESH: refresh_transports,
    }
    return JWTAuth(
        jwt_provider, transports, request, response, token_storage=get_token_storage()
    )


TokenAuthDep = Annotated[ITokenAuth, Depends(get_token_auth)]
TokenStorageDep = Annotated[ITokenStorage, Depends(get_token_storage)]
PasswordHasherDep = Annotated[IPasswordHasher, Depends(get_password_hasher)]
