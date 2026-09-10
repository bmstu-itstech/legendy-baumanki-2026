from src.core.domain.exceptions.exceptions import (
    AppException,
    NotFound,
    PermissionDenied,
)
from starlette import status


class ProfileNotFound(NotFound):
    detail = "Profile not found."


class TeamIsFull(AppException):
    status_code = status.HTTP_409_CONFLICT
    detail = "Team is full."


class UserAlreadyInTeam(AppException):
    status_code = status.HTTP_409_CONFLICT
    detail = "User already in team."


class UserIsNotInTeam(NotFound):
    detail = "Team not found: user is not in team."


class UserIsNotTeamLeader(PermissionDenied):
    detail = "User is not team leader."


class TeamNotFound(NotFound):
    detail = "Team not found."
