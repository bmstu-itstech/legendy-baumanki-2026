from src.core.domain.exceptions.exceptions import BadRequest, NotFound


class FileNotFound(NotFound):
    detail = "File not found"
    error_code = "file_not_found"


class FileTooLarge(BadRequest):
    detail = "File is too large"
    error_code = "file_too_large"
