from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    TEAM_CODE_LENGTH: int = 6


settings = Settings()
