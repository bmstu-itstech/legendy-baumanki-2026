from src.auth.config import auth_config
from src.auth.domain.exceptions import RateLimitExceeded
from src.auth.infra.services.inmemory_rate_limiter import rate_limiter
from starlette.requests import Request

# Экспериментальная фича — выключена по умолчанию (auth_config.RATE_LIMIT_ENABLED).
# --forwarded-allow-ips='*' --proxy-headers в entrypoint.sh уже заставляют
# uvicorn подставлять в request.client реальный IP клиента из
# X-Forwarded-For/X-Real-IP, а не IP обратного прокси.


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def enforce_login_rate_limit(request: Request, email: str) -> None:
    if not auth_config.RATE_LIMIT_ENABLED:
        return

    # По IP — мягкий второй рубеж, не блокирует всю сеть из-за одного
    # человека, ошибающегося паролем.
    ip = _client_ip(request)
    if rate_limiter.hit(
        f"login:ip:{ip}",
        auth_config.LOGIN_RATE_LIMIT_PER_IP,
        auth_config.LOGIN_RATE_LIMIT_PER_IP_WINDOW_SECONDS,
    ):
        raise RateLimitExceeded()

    # По email — бьёт конкретный аккаунт, который брутфорсят.
    if rate_limiter.hit(
        f"login:email:{email.lower()}",
        auth_config.LOGIN_RATE_LIMIT_PER_EMAIL,
        auth_config.LOGIN_RATE_LIMIT_PER_EMAIL_WINDOW_SECONDS,
    ):
        raise RateLimitExceeded()


def enforce_register_rate_limit(request: Request) -> None:
    if not auth_config.RATE_LIMIT_ENABLED:
        return

    # Аккаунта ещё нет — лимитируем только по IP, порог выше, чем у login.
    ip = _client_ip(request)
    if rate_limiter.hit(
        f"register:ip:{ip}",
        auth_config.REGISTER_RATE_LIMIT_PER_IP,
        auth_config.REGISTER_RATE_LIMIT_PER_IP_WINDOW_SECONDS,
    ):
        raise RateLimitExceeded()
