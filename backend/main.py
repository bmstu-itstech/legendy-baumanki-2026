import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqladmin import Admin
from src.auth.presentation.admin import AdminAuth, UserAdmin
from src.auth.presentation.api import auth_api_router
from src.auth.presentation.middlewares import (
    AuthenticationMiddleware,
    JWTRefreshMiddleware,
    SecurityMiddleware,
)
from src.core.config import settings
from src.core.domain.exceptions.exceptions import AppException
from src.db.engine import engine
from src.profile.presentation.admin import ProfileAdmin, TeamAdmin
from src.profile.presentation.api import profiles_api_router, teams_api_router
from starlette.middleware.cors import CORSMiddleware

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
)


@app.exception_handler(AppException)
async def app_exception_handler(_: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "error_code": exc.error_code,
            **(exc.extra or {}),
        },
    )


if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
    )
app.add_middleware(SecurityMiddleware)
app.add_middleware(AuthenticationMiddleware)
app.add_middleware(JWTRefreshMiddleware)
# Добавлена последней, чтобы стать самой внешней middleware и
# обрабатывать CORS-preflight (OPTIONS) раньше остальных.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # Фронтенд читает access-токен из заголовка ответа Authorization
    # (см. frontend/lib/api/client.ts) — без явного expose_headers браузер
    # скрывает этот заголовок от JS, даже если сервер его прислал.
    expose_headers=["Authorization"],
)

app.include_router(auth_api_router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(
    profiles_api_router, prefix=f"{settings.API_V1_STR}/profiles", tags=["profiles"]
)
app.include_router(
    teams_api_router, prefix=f"{settings.API_V1_STR}/teams", tags=["teams"]
)

admin = Admin(
    app, engine, authentication_backend=AdminAuth(secret_key=settings.SECRET_KEY)
)
admin.add_view(UserAdmin)
admin.add_view(ProfileAdmin)
admin.add_view(TeamAdmin)
