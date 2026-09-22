from functools import cached_property

from pydantic import SecretStr
from pydantic_settings import BaseSettings


class AuthConfig(BaseSettings):
    JWT_ALGORITHM: str = "ES256"
    JWT_ISSUER: str = "lb26-auth"
    JWT_PRIVATE_KEY_PATH: str = "./secrets/ec_private.pem"
    JWT_PUBLIC_KEY_PATH: str = "./secrets/ec_public.pem"
    JWT_ACCESS_TOKEN_EXPIRE_SECONDS: int = 60 * 15  # 15 минут
    # 60 секунд * 60 минут * 24 часа * 30 дней = 30 дней
    JWT_REFRESH_TOKEN_EXPIRE_SECONDS: int = 60 * 60 * 24 * 30
    JWT_ACCESS_HEADER_NAME: str = "Authorization"
    JWT_HEADER_TYPE: str = "Bearer"

    # Регистрация закрыта: /auth/register отвечает 403. Вернуть можно через
    # env REGISTRATION_ENABLED=true без правки кода.
    REGISTRATION_ENABLED: bool = False

    # Экспериментальная фича, по умолчанию выключена — см. RateLimitDep.
    # Лимитер in-memory (как и InMemoryTokenStorage): переживает один процесс,
    # но не шарится между несколькими воркерами/репликами backend.
    RATE_LIMIT_ENABLED: bool = False
    # /auth/login: по email (метит конкретный аккаунт) и по IP (второй, более
    # мягкий рубеж — не блокирует всю кампусную сеть, если один человек
    # ошибается паролем).
    LOGIN_RATE_LIMIT_PER_EMAIL: int = 5
    LOGIN_RATE_LIMIT_PER_EMAIL_WINDOW_SECONDS: int = 60
    LOGIN_RATE_LIMIT_PER_IP: int = 20
    LOGIN_RATE_LIMIT_PER_IP_WINDOW_SECONDS: int = 60
    # /auth/register: аккаунта ещё нет, поэтому только по IP — порог выше,
    # чем для login, чтобы не мешать обычной регистрации нескольких студентов
    # из одной общаги/аудитории.
    REGISTER_RATE_LIMIT_PER_IP: int = 10
    REGISTER_RATE_LIMIT_PER_IP_WINDOW_SECONDS: int = 60 * 10

    @cached_property
    def JWT_PRIVATE_KEY(self) -> SecretStr:
        with open(self.JWT_PRIVATE_KEY_PATH) as f:
            return SecretStr(f.read())

    @cached_property
    def JWT_PUBLIC_KEY(self) -> SecretStr:
        with open(self.JWT_PUBLIC_KEY_PATH) as f:
            return SecretStr(f.read())


auth_config = AuthConfig()
