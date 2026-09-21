import time

import pytest
from src.auth.config import auth_config
from src.auth.domain.exceptions import RateLimitExceeded
from src.auth.infra.services.inmemory_rate_limiter import InMemoryRateLimiter
from src.auth.presentation.rate_limit import (
    enforce_login_rate_limit,
    enforce_register_rate_limit,
)


class _FakeClient:
    def __init__(self, host: str):
        self.host = host


class _FakeRequest:
    def __init__(self, ip: str):
        self.client = _FakeClient(ip)


@pytest.fixture(autouse=True)
def _restore_rate_limit_flag():
    original = auth_config.RATE_LIMIT_ENABLED
    yield
    auth_config.RATE_LIMIT_ENABLED = original


def test_limiter_allows_up_to_the_limit_then_blocks():
    limiter = InMemoryRateLimiter()
    for _ in range(5):
        assert limiter.hit("k", limit=5, window_seconds=60) is False
    assert limiter.hit("k", limit=5, window_seconds=60) is True


def test_limiter_resets_after_window_expires():
    limiter = InMemoryRateLimiter()
    assert limiter.hit("k", limit=1, window_seconds=0.05) is False
    assert limiter.hit("k", limit=1, window_seconds=0.05) is True
    time.sleep(0.06)
    assert limiter.hit("k", limit=1, window_seconds=0.05) is False


def test_limiter_keys_are_independent():
    limiter = InMemoryRateLimiter()
    assert limiter.hit("a", limit=1, window_seconds=60) is False
    assert limiter.hit("b", limit=1, window_seconds=60) is False


def test_disabled_by_default_never_raises():
    assert auth_config.RATE_LIMIT_ENABLED is False
    request = _FakeRequest("1.1.1.1")
    for _ in range(1000):
        enforce_login_rate_limit(request, "flood@example.com")
        enforce_register_rate_limit(request)


def test_login_blocks_by_email_when_enabled():
    auth_config.RATE_LIMIT_ENABLED = True
    request = _FakeRequest("2.2.2.2")
    limit = auth_config.LOGIN_RATE_LIMIT_PER_EMAIL
    for _ in range(limit):
        enforce_login_rate_limit(request, "victim-1@example.com")
    with pytest.raises(RateLimitExceeded):
        enforce_login_rate_limit(request, "victim-1@example.com")


def test_login_blocks_by_ip_across_different_emails_when_enabled():
    auth_config.RATE_LIMIT_ENABLED = True
    request = _FakeRequest("3.3.3.3")
    limit = auth_config.LOGIN_RATE_LIMIT_PER_IP
    for i in range(limit):
        enforce_login_rate_limit(request, f"someone-{i}@example.com")
    with pytest.raises(RateLimitExceeded):
        enforce_login_rate_limit(request, "yet-another@example.com")


def test_register_blocks_by_ip_when_enabled():
    auth_config.RATE_LIMIT_ENABLED = True
    request = _FakeRequest("4.4.4.4")
    limit = auth_config.REGISTER_RATE_LIMIT_PER_IP
    for _ in range(limit):
        enforce_register_rate_limit(request)
    with pytest.raises(RateLimitExceeded):
        enforce_register_rate_limit(request)
