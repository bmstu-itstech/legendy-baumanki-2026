from pydantic import EmailStr, SecretStr
from src.core.domain.entities import CustomModel


class UserCreateDTO(CustomModel):
    email: str = EmailStr()
    password: SecretStr
    utm_source: str | None = None
    utm_campaign: str | None = None


class UserCreatedDTO(CustomModel):
    id: int


class Credentials(CustomModel):
    email: str
    password: SecretStr
