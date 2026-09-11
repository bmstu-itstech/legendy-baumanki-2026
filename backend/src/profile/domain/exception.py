from src.core.domain.exceptions.exceptions import (
    AlreadyExists,
    AppException,
    NotFound,
    PermissionDenied,
)
from starlette import status


class ProfileNotFound(NotFound):
    detail = "Profile not found."
    error_code = "profile_not_found"


class ProfileAlreadyExists(AlreadyExists):
    detail = "Profile already exists."
    error_code = "profile_already_exists"


class TeamIsFull(AppException):
    status_code = status.HTTP_409_CONFLICT
    detail = "Team is full."
    error_code = "team_is_full"


class UserAlreadyInTeam(AppException):
    status_code = status.HTTP_409_CONFLICT
    detail = "User already in team."
    error_code = "user_already_in_team"


class UserIsNotInTeam(NotFound):
    detail = "Team not found: user is not in team."
    error_code = "user_is_not_in_team"


class UserIsNotTeamLeader(PermissionDenied):
    detail = "User is not team leader."
    error_code = "user_is_not_team_leader"


class TeamNotFound(NotFound):
    detail = "Team not found."
    error_code = "team_not_found"
