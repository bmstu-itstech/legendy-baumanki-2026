from src.core.domain.exceptions import statuses


class AppException(Exception):
    status_code = statuses.HTTP_500_INTERNAL_SERVER_ERROR
    detail = "Server error"
    # Стабильный машиночитаемый код — по нему фронтенд подбирает
    # локализованный текст (см. frontend/lib/api/errors.ts). detail может
    # быть динамическим (например, содержать конкретный email), поэтому
    # сопоставлять локализацию нужно по error_code, а не по тексту detail.
    error_code = "internal_error"
    extra: dict | None = None

    def __init__(
        self, status_code: int | None = None, detail: str | None = None, **kwargs
    ) -> None:
        self.status_code = self.status_code if not status_code else status_code
        self.detail = self.detail if not detail else detail
        self.extra = self.extra if not kwargs else kwargs
        super().__init__(self.detail)


class PermissionDenied(AppException):
    status_code = statuses.HTTP_403_FORBIDDEN
    detail = "Permission denied"
    error_code = "permission_denied"


class NotFound(AppException):
    status_code = statuses.HTTP_404_NOT_FOUND
    detail = "Not found"
    error_code = "not_found"


class AlreadyExists(AppException):
    status_code = statuses.HTTP_409_CONFLICT
    detail = "Already exists"
    error_code = "already_exists"


class BadRequest(AppException):
    status_code = statuses.HTTP_400_BAD_REQUEST
    detail = "Bad Request"
    error_code = "bad_request"


class NotAuthenticated(AppException):
    status_code = statuses.HTTP_401_UNAUTHORIZED
    detail = "User not authenticated"
    error_code = "not_authenticated"


class TooManyRequests(AppException):
    status_code = statuses.HTTP_429_TOO_MANY_REQUESTS
    detail = "Too many requests"
    error_code = "too_many_requests"
