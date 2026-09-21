import functools
from collections.abc import Callable
from typing import Any

from fastapi import HTTPException
from src.auth.domain.entities import AnonymousUser
from src.auth.domain.exceptions import AuthRequired
from src.core.domain.exceptions.exceptions import PermissionDenied
from starlette.requests import Request


class access_control:
    def __init__(
        self,
        superuser: bool = False,
        opened: bool = False,
    ) -> None:
        self.superuser: bool = superuser
        self.open: bool = opened
        self.current_user = None
        self.request: Request | None = None
        self.headers: dict[Any, Any] | None = None
        self.auth_header: str | None = None
        self.token: str | None = None

    def __call__(self, function) -> Callable[..., Any]:
        @functools.wraps(function)
        async def decorated(*args, **kwargs):
            await self.parse_request(**kwargs)
            is_allowed = await self.verify_request(*args, **kwargs)
            if not is_allowed:
                raise HTTPException(403, "Not allowed.")
            return await function(*args, **kwargs)

        return decorated

    async def parse_request(self, **kwargs) -> None:
        request = getattr(kwargs.get("auth"), "request", None) or kwargs.get("request")
        user = getattr(request, "state", None) and getattr(request.state, "user", None)
        self.current_user = user if user is not None else AnonymousUser()

    async def verify_request(self, *args, **kwargs) -> bool:
        if self.superuser and not self.current_user.is_superuser:
            raise PermissionDenied()

        if isinstance(self.current_user, AnonymousUser) and not self.open:
            raise AuthRequired()

        return True


async def require_superuser(request: Request) -> None:
    """
    Depends()-зависимость для целого роутера (APIRouter(dependencies=[...])) —
    в отличие от @access_control(superuser=True) на каждом хендлере, её
    невозможно забыть навесить на новый эндпоинт: она проверяется для любого
    маршрута, зарегистрированного на этом роутере, до вызова самого хендлера.
    """
    user = getattr(request.state, "user", None) or AnonymousUser()
    if not user.is_superuser:
        raise PermissionDenied()
