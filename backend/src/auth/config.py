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

    @cached_property
    def JWT_PRIVATE_KEY(self) -> SecretStr:
        with open(self.JWT_PRIVATE_KEY_PATH) as f:
            return SecretStr(f.read())

    @cached_property
    def JWT_PUBLIC_KEY(self) -> SecretStr:
        with open(self.JWT_PUBLIC_KEY_PATH) as f:
            return SecretStr(f.read())


auth_config = AuthConfig()
