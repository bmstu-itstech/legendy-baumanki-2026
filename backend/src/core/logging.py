import functools
import inspect
import json
import logging
import sys
from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel

usecase_logger = logging.getLogger("usecase")

# Поля, значения которых никогда не пишем в лог как есть (пароли, хэши,
# токены) — даже если они попадут в лог через DTO, а не именованный параметр.
_REDACT_NAME_MARKERS = ("password", "passhash", "token", "secret")

# Сентинел, а не None — иначе легитимное значение параметра None (например
# `uploaded_by: int | None = None`) было бы неотличимо от "не логируем".
_SKIP = object()


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.fromtimestamp(
                record.created, tz=UTC
            ).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)


def configure_logging(level: int = logging.INFO) -> None:
    """Стандартный logging → stdout в JSON, без файлов на диске.

    Локальные файлы не пишем осознанно: в проде логи агрегируются внешним
    сервисом со stdout контейнера (см. обсуждение инцидента с баллами).
    """
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(level)


def _redact(name: str, value: Any) -> Any:
    if any(marker in name.lower() for marker in _REDACT_NAME_MARKERS):
        return "***"
    return value


def _safe_value(name: str, value: Any) -> Any:
    if isinstance(value, bytes):
        return f"<{len(value)} bytes>"
    if isinstance(value, BaseModel):
        return {
            k: _redact(k, v) for k, v in value.model_dump(mode="json").items()
        }
    if value is None or isinstance(value, int | str | bool | float):
        return _redact(name, value)
    # Объекты вроде uow/*_provider/pwd_hasher/auth — зависимости, не данные,
    # их не логируем (и всё равно не сериализуются в JSON).
    return _SKIP


def log_usecase(func):
    """Логирует каждый вызов юзкейса: аргументы (без секретов) и исход.

    Не перехватывает исключение — только логирует и пробрасывает дальше,
    чтобы поведение usecase'ов не менялось.
    """

    sig = inspect.signature(func)

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        bound = sig.bind(*args, **kwargs)
        bound.apply_defaults()
        safe_args = {
            name: safe
            for name, value in bound.arguments.items()
            if (safe := _safe_value(name, value)) is not _SKIP
        }
        try:
            result = await func(*args, **kwargs)
        except Exception:
            usecase_logger.warning(
                "%s failed args=%s", func.__name__, safe_args, exc_info=True
            )
            raise
        usecase_logger.info("%s ok args=%s", func.__name__, safe_args)
        return result

    return wrapper
