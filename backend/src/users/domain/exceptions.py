from src.core.domain.exceptions.exceptions import AlreadyExists, NotFound


class UserAlreadyExists(AlreadyExists):
    detail = "User already exists."


class UserNotFound(NotFound):
    detail = "User with this data not found"
