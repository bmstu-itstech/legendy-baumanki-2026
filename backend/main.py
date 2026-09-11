import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqladmin import Admin
from src.auth.presentation.admin import UserAdmin
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
        status_code=exc.status_code, content={"detail": exc.detail, **(exc.extra or {})}
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

app.include_router(auth_api_router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(
    profiles_api_router, prefix=f"{settings.API_V1_STR}/profiles", tags=["profiles"]
)
app.include_router(
    teams_api_router, prefix=f"{settings.API_V1_STR}/teams", tags=["teams"]
)

admin = Admin(app, engine)
admin.add_view(UserAdmin)
admin.add_view(ProfileAdmin)
admin.add_view(TeamAdmin)
