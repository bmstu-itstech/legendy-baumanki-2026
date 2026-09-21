from src.auth.domain.entities import AnonymousUser, TokenType
from src.auth.domain.exceptions import RefreshTokenNotValid
from src.auth.infra.db.uow import PGUserUnitOfWork
from src.auth.presentation.dependencies import get_token_auth
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


class JWTRefreshMiddleware(BaseHTTPMiddleware):
    """
    Middleware автоматически обновляет access токен используя валидный refresh токен.

    Если access токен невалиден, выполняет попытку его обновления через refresh.
    Обновлённый refresh токен вставляется в ответ.
    """

    async def dispatch(self, request: Request, call_next):
        pre_auth = await get_token_auth(request=request)
        access_data = await pre_auth.read_token(TokenType.ACCESS)
        if access_data is None:
            try:
                await pre_auth.refresh_access_token()
            except RefreshTokenNotValid:
                # Токен не может быть обновлён - откат к неавторизованному запросу
                ...
        response = await call_next(request)
        # Проверяем, что токен всё ещё валиден
        post_auth = await get_token_auth(request=request, response=response)
        refresh_data = await post_auth.read_token(TokenType.REFRESH)
        if refresh_data:
            await pre_auth.inject_access_token_from_request(response)

        return response


class AuthenticationMiddleware(BaseHTTPMiddleware):
    """
    Middleware которая вставляет аутентифицированного пользователя в
    `request.state.user`.

    Если в запросе нет валидного access токена, вставляет None.
    """

    def __init__(self, app):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        jwt_auth = await get_token_auth(request=request)
        token_data = await jwt_auth.read_token(TokenType.ACCESS)
        if not token_data:
            request.state.user = AnonymousUser()
        else:
            async with PGUserUnitOfWork() as uow:
                user = await uow.users.get_by_id(token_data.uid)
                request.state.user = user or None  # Если пользователь не найден

        response = await call_next(request)
        return response


class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Middleware, которая ограничивает доступ к некоторым путям.

    Если текущий пользователь не суперпользователь и пытается получить
    доступ к защищённого пути, который не доступен явно, возвращает ответ с 403.
    """

    def __init__(
        self, app, secure_paths: list | None = None, allowed_paths: list | None = None
    ):
        super().__init__(app)
        self.secure_paths = secure_paths or ["/admin", "/docs", "/redoc"]
        self.allowed_paths = allowed_paths or ["/api/v1", "/docs", "/redoc"]

    async def dispatch(self, request: Request, call_next):
        # ТОЛЬКО путь, без query-string/хоста/схемы, и startswith вместо `in` —
        # иначе `?x=/api/v1` в query-параметре любого URL (подстрока где
        # угодно в str(request.url)) снимал защиту с /admin для анонима.
        request_path = request.url.path

        is_protected_path = any(
            request_path.startswith(path) for path in self.secure_paths
        )
        is_allowed_path = any(
            request_path.startswith(path) for path in self.allowed_paths
        )

        if (
            is_protected_path
            and not is_allowed_path
            and not request.state.user.is_superuser
        ):
            return JSONResponse(
                status_code=403, content={"message": "Permission Denied"}
            )

        response = await call_next(request)
        return response
