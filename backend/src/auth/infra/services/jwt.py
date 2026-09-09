import datetime as dt
from typing import Any

import uuid6
from jose import JWTError, jwt
from src.auth.config import auth_config
from src.auth.domain.entities import AuthUser, TokenData, TokenType
from src.auth.domain.exceptions import RefreshTokenNotValid
from src.auth.domain.interfaces.token_auth import ITokenAuth, TResponse
from src.auth.domain.interfaces.token_provider import ITokenProvider
from src.auth.domain.interfaces.token_storage import ITokenStorage
from src.auth.infra.transports.base import IAuthTransport
from src.utils.datetimes import get_timezone_now
from starlette.requests import Request
from starlette.responses import Response


class JWTProvider(ITokenProvider):
    """Сервис для создания и декодирования JWT-токенов"""

    def create_access_token(self, data: dict) -> str:
        return self._encode_jwt(
            data=data,
            secret=auth_config.JWT_PRIVATE_KEY.get_secret_value(),
            lifetime_seconds=auth_config.JWT_ACCESS_TOKEN_EXPIRE_SECONDS,
        )

    def create_refresh_token(self, data: dict) -> str:
        return self._encode_jwt(
            data=data,
            secret=auth_config.JWT_PRIVATE_KEY.get_secret_value(),
            lifetime_seconds=auth_config.JWT_REFRESH_TOKEN_EXPIRE_SECONDS,
        )

    def _encode_jwt(
        self,
        data: dict,
        secret: str,
        lifetime_seconds: int | None = None,
        algorithm: str = auth_config.JWT_ALGORITHM,
    ) -> str:
        payload = data.copy()
        if lifetime_seconds:
            expire = get_timezone_now() + dt.timedelta(seconds=lifetime_seconds)
            payload["exp"] = expire
        payload["iat"] = get_timezone_now()
        payload["jti"] = str(uuid6.uuid6())  # JWT ID
        payload["iss"] = auth_config.JWT_ISSUER
        return jwt.encode(payload, secret, algorithm=algorithm)

    def read_token(self, token: str | None) -> TokenData | None:
        if token is None:
            return None
        try:
            data = self._decode_jwt(
                token,
                auth_config.JWT_PUBLIC_KEY.get_secret_value(),
                algorithms=[auth_config.JWT_ALGORITHM],
            )
            user_id = data.get("uid")
            if user_id is None:
                return None
            return TokenData(**data)
        except JWTError:
            return None

    def _decode_jwt(
        self,
        token: str,
        secret: str,
        algorithms: list[str] | None = None,
    ) -> dict[str, Any]:
        if not algorithms:
            algorithms = [auth_config.JWT_ALGORITHM]
        return jwt.decode(
            token, key=secret, algorithms=algorithms, issuer=auth_config.JWT_ISSUER
        )


class JWTAuth(ITokenAuth):
    def __init__(
        self,
        token_provider: ITokenProvider,
        transports: dict[TokenType, list[IAuthTransport]],
        request: Request,
        response: Response | None = None,
        token_storage: ITokenStorage | None = None,
    ):
        super().__init__(token_provider, token_storage)
        self._transports = transports
        self._request = request
        self._response = response

    async def set_tokens(self, user: AuthUser) -> None:
        data = {
            "uid": user.id,
            "is_superuser": user.is_superuser,
        }
        access_token = self._provider.create_access_token(data)
        await self.set_token(access_token, TokenType.ACCESS)
        refresh_token = self._provider.create_refresh_token(data)
        await self.set_token(refresh_token, TokenType.REFRESH)

    async def set_token(self, token: str, token_type: TokenType) -> None:
        if self._response:
            for transport in self._get_transports(token_type):
                transport.set_token(self._response, token)

        if self._storage:
            token = self._provider.read_token(token)
            if token:
                await self._storage.store_token(token)

    async def unset_tokens(self) -> None:
        if self._storage:
            await self._storage.revoke_tokens_by_user(self._request.state.user.id)
        if not self._response:
            return
        for transports in self._transports.values():
            for transport in transports:
                transport.delete_token(self._response)

    async def refresh_access_token(self) -> None:
        refresh_token_data = await self.read_token(TokenType.REFRESH)
        if not refresh_token_data:
            raise RefreshTokenNotValid()

        access_token = self._provider.create_access_token(
            refresh_token_data.model_dump(include={"uid", "is_superuser"})
        )

        self._request.state.access_token = access_token

        if self._storage:
            token = self._provider.read_token(access_token)
            assert token
            await self._storage.store_token(token)

        if self._response:
            for transport in self._get_transports(TokenType.ACCESS):
                transport.set_token(self._response, access_token)

    async def read_token(self, token_type: TokenType) -> TokenData | None:
        token = (
            self._get_access_token()
            if token_type == TokenType.ACCESS
            else self._get_refresh_token()
        )
        token_data = self._provider.read_token(token)
        if token_data:
            return await self._validate_token_or_none(token_data)
        return None

    def _get_access_token(self) -> str | None:
        if hasattr(self._request.state, "access_token"):
            return self._request.state.access_token

        for transport in self._get_transports(TokenType.ACCESS):
            token = transport.get_token(self._request)
            if token is not None:
                return token
        return None

    def _get_refresh_token(self) -> str | None:
        for transport in self._get_transports(TokenType.REFRESH):
            token = transport.get_token(self._request)
            if token is not None:
                return token
        return None

    async def _validate_token_or_none(self, token_data: TokenData) -> TokenData | None:
        if not token_data:
            return None

        if token_data.jti and self._storage:
            is_active = await self._storage.is_token_active(token_data.jti)
            if not is_active:
                return None
        return token_data

    async def inject_access_token_from_request(self, response: TResponse) -> None:
        if hasattr(self._request.state, "access_token"):
            access_token = self._request.state.access_token
            self._response = response
            await self.set_token(access_token, TokenType.ACCESS)

    def _get_transports(self, transport_type: TokenType) -> list[IAuthTransport]:
        for tt, transports in self._transports.items():
            if tt == transport_type:
                return transports
        return []
