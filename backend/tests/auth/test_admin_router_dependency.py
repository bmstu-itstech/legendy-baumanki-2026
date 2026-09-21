from fastapi import APIRouter, Depends, FastAPI
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient
from src.auth.presentation.permissions import require_superuser
from src.core.domain.exceptions.exceptions import AppException


class _FakeUser:
    def __init__(self, is_superuser: bool):
        self.is_superuser = is_superuser


def _build_app(user: _FakeUser) -> FastAPI:
    app = FastAPI()

    @app.exception_handler(AppException)
    async def app_exception_handler(_, exc: AppException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

    @app.middleware("http")
    async def inject_user(request, call_next):
        request.state.user = user
        return await call_next(request)

    # Тот же паттерн, что в src/tasks/presentation/admin_api.py:
    # проверка на уровне роутера, а не на каждом хендлере отдельно.
    router = APIRouter(dependencies=[Depends(require_superuser)])

    @router.get("/new-endpoint-without-decorator")
    async def endpoint_added_later():
        return {"ok": True}

    app.include_router(router, prefix="/admin/content")
    return app


def test_new_route_without_decorator_is_blocked_for_non_superuser():
    client = TestClient(_build_app(_FakeUser(is_superuser=False)))
    response = client.get("/admin/content/new-endpoint-without-decorator")
    assert response.status_code == 403


def test_new_route_without_decorator_is_allowed_for_superuser():
    client = TestClient(_build_app(_FakeUser(is_superuser=True)))
    response = client.get("/admin/content/new-endpoint-without-decorator")
    assert response.status_code == 200
