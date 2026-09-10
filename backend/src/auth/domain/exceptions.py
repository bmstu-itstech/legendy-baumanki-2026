from src.core.domain.exceptions.exceptions import (
    AlreadyExists,
    BadRequest,
    NotAuthenticated,
    NotFound,
)


class ErrorCode:
    AUTHENTICATION_REQUIRED = "Authentication required."
    AUTHORIZATION_FAILED = "Authorization failed. User has no access."
    INVALID_TOKEN = "Invalid token."
    INVALID_CREDENTIALS = "Invalid credentials."
    EMAIL_TAKEN = "Email is already taken."
    REFRESH_TOKEN_NOT_VALID = "Refresh token is not valid."
    REFRESH_TOKEN_REQUIRED = "Refresh token is required either in the body or cookie."


class UserAlreadyExists(AlreadyExists):
    detail = "User already exists."
    error_code = "user_already_exists"


class UserNotFound(NotFound):
    detail = "User with this data not found"
    error_code = "user_not_found"


class AuthRequired(NotAuthenticated):
    detail = ErrorCode.AUTHENTICATION_REQUIRED
    error_code = "auth_required"


class AuthorizationFailed(NotAuthenticated):
    detail = ErrorCode.AUTHORIZATION_FAILED
    error_code = "authorization_failed"


class InvalidToken(NotAuthenticated):
    detail = ErrorCode.INVALID_TOKEN
    error_code = "invalid_token"


class InvalidCredentials(NotAuthenticated):
    detail = ErrorCode.INVALID_CREDENTIALS
    error_code = "invalid_credentials"


class EmailTaken(BadRequest):
    detail = ErrorCode.EMAIL_TAKEN
    error_code = "email_taken"


class RefreshTokenRequired(BadRequest):
    detail = ErrorCode.REFRESH_TOKEN_REQUIRED
    error_code = "refresh_token_required"


class RefreshTokenNotValid(NotAuthenticated):
    detail = ErrorCode.REFRESH_TOKEN_NOT_VALID
    error_code = "refresh_token_not_valid"
