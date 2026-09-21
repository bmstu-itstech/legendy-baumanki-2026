from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    FILES_STORAGE_DIR: str = "storage/files"
    FILES_MAX_UPLOAD_SIZE_MB: int = 20

    @property
    def max_upload_size_bytes(self) -> int:
        return self.FILES_MAX_UPLOAD_SIZE_MB * 1024 * 1024


settings = Settings()
