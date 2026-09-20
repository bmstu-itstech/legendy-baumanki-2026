import logging

from fastapi import APIRouter, FastAPI, Request
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
from src.files.presentation.api import files_api_router
from src.profile.presentation.admin import ProfileAdmin, TeamAdmin
from src.profile.presentation.api import profiles_api_router, teams_api_router
from src.tasks.presentation.admin import (
    ModuleAdmin,
    SectionAdmin,
    StateAdmin,
    TaskAdmin,
    TaskAnswerAdmin,
    TaskMediaAdmin,
    TaskQuestionAdmin,
    TeamAnswerAdmin,
)
from src.tasks.presentation.api import (
    modules_api_router,
    ratings_api_router,
    tasks_api_router,
)
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


app.add_middleware(SecurityMiddleware)
app.add_middleware(AuthenticationMiddleware)
app.add_middleware(JWTRefreshMiddleware)
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.backend_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
    )

api_router = APIRouter()
app.include_router(api_router, prefix=settings.API_V1_STR)

api_router.include_router(auth_api_router, prefix="/auth", tags=["auth"])
api_router.include_router(profiles_api_router, prefix="/profiles", tags=["profiles"])
api_router.include_router(teams_api_router, prefix="/teams", tags=["teams"])
api_router.include_router(modules_api_router, prefix="/modules", tags=["modules"])
api_router.include_router(tasks_api_router, prefix="/tasks", tags=["tasks"])
api_router.include_router(ratings_api_router, prefix="/ratings", tags=["ratings"])
api_router.include_router(files_api_router, prefix="/files", tags=["files"])

admin = Admin(app, engine)
admin.add_view(UserAdmin)
admin.add_view(ProfileAdmin)
admin.add_view(TeamAdmin)
admin.add_view(ModuleAdmin)
admin.add_view(SectionAdmin)
admin.add_view(TaskAdmin)
admin.add_view(TaskQuestionAdmin)
admin.add_view(TaskAnswerAdmin)
admin.add_view(TaskMediaAdmin)
admin.add_view(StateAdmin)
admin.add_view(TeamAnswerAdmin)
