from src.core.domain.exceptions.exceptions import (
    AppException,
    BadRequest,
    NotFound,
    PermissionDenied,
)
from starlette import status


class UserIsNotInTeam(PermissionDenied):
    detail = "User is not in team."
    error_code = "user_is_not_in_team"


class TeamIsNotCompleted(PermissionDenied):
    detail = "Team is not completed."
    error_code = "team_is_not_completed"


class ModuleNotFound(NotFound):
    detail = "Module not found."
    error_code = "module_not_found"


class TaskNotFound(NotFound):
    detail = "Task not found."
    error_code = "task_not_found"


class RatingNotFound(NotFound):
    detail = "Rating not found."
    error_code = "rating_not_found"


class TaskIllegalStatusTransition(AppException):
    detail = "Task status transition is illegal."
    error_code = "task_illegal_status_transition"
    status_code = status.HTTP_409_CONFLICT


class AnswersDoesNotMatchQuestions(BadRequest):
    detail = "Answers does not match questions."
    error_code = "answers_not_match_questions"
