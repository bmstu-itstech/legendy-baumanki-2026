from pydantic import SecretStr
from src.core.domain.entities import CustomModel


class UserCreateDTO(CustomModel):
    email: str
    password: str = SecretStr("password")
    utm_source: str | None = None
    utm_campaign: str | None = None


class UserCreatedDTO(CustomModel):
    id: int
