from pydantic import SecretStr
from src.core.domain.entities import CustomModel


class Credentials(CustomModel):
    email: str
    password: SecretStr
