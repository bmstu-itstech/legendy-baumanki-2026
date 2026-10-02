from starlette import status

from src.core.domain.exceptions.exceptions import (
    AlreadyExists,
    AppException,
    NotFound,
    PermissionDenied,
)


class FinalBookingClosed(PermissionDenied):
    detail = "Final booking is closed."
    error_code = "final_booking_closed"


class FinalSlotNotFound(NotFound):
    detail = "Final slot not found."
    error_code = "final_slot_not_found"


class FinalSlotIsFull(AppException):
    status_code = status.HTTP_409_CONFLICT
    detail = "Final slot is full."
    error_code = "final_slot_is_full"


class TeamAlreadyBookedFinal(AlreadyExists):
    detail = "Team already booked a final slot."
    error_code = "team_already_booked_final"


class FinalBookingNotFound(NotFound):
    detail = "Team has no final booking."
    error_code = "final_booking_not_found"


class FinalTeamTooSmall(PermissionDenied):
    detail = "Team is too small for the final."
    error_code = "final_team_too_small"


class FinalTeamNotFound(NotFound):
    detail = "Team not found."
    error_code = "final_team_not_found"


# Те же error_code, что и в модуле profile — фронтенд уже умеет их переводить.
class UserIsNotInTeam(PermissionDenied):
    detail = "User is not in team."
    error_code = "user_is_not_in_team"


class UserIsNotTeamLeader(PermissionDenied):
    detail = "User is not team leader."
    error_code = "user_is_not_team_leader"
