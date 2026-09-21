import time
from collections import defaultdict


class InMemoryRateLimiter:
    """
    Rate limiter на скользящем окне, хранит попытки в памяти процесса.

    Как и InMemoryTokenStorage — переживает один процесс, но не шарится
    между несколькими воркерами/репликами backend. Для одного процесса
    (см. entrypoint.sh: `uvicorn main:app` без --workers) этого достаточно.
    """

    def __init__(self):
        self._hits: dict[str, list[float]] = defaultdict(list)

    def hit(self, key: str, limit: int, window_seconds: int) -> bool:
        """Регистрирует попытку по ключу, возвращает True, если лимит уже превышен."""
        now = time.monotonic()
        cutoff = now - window_seconds
        bucket = self._hits[key]
        while bucket and bucket[0] < cutoff:
            bucket.pop(0)
        if len(bucket) >= limit:
            return True
        bucket.append(now)
        return False


rate_limiter = InMemoryRateLimiter()
