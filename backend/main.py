import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqladmin import Admin
from src.auth.presentation.api import auth_api_router
from src.auth.presentation.middlewares import (
    AuthenticationMiddleware,
    JWTRefreshMiddleware,
)
from src.core.config import settings
from src.core.domain.exceptions.exceptions import AppException
from src.db.engine import engine
from src.users.presentation.admin import UserAdmin
from src.users.presentation.api import users_api_router

logger = logging.getLogger(__name__)


app = FastAPI(
    title=settings.PROJECT_NAME,
)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code, content={"detail": exc.detail, **(exc.extra or {})}
    )


# app.add_middleware(SecurityMiddleware)
app.add_middleware(AuthenticationMiddleware)
app.add_middleware(JWTRefreshMiddleware)

app.include_router(auth_api_router, prefix=f"{settings.API_V1_STR}/auth")
app.include_router(users_api_router, prefix=f"{settings.API_V1_STR}/users")

admin = Admin(app, engine)
admin.add_view(UserAdmin)
