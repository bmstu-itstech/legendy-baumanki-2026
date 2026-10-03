import datetime as dt

import pytest
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

from src.core.domain.exceptions.exceptions import AppException
from src.final.config import settings
from src.final.domain.exceptions import (
    FinalBookingNotFound,
    FinalSlotIsFull,
    FinalSlotNotFound,
    FinalTeamNotFound,
    TeamAlreadyBookedFinal,
)
from src.final.presentation.admin_api import admin_final_api_router
from src.final.presentation.dependencies import get_final_uow
from src.final.usecases import (
    admin_add_final_team,
    admin_get_final,
    admin_remove_final_team,
)
from src.utils.datetimes import tz
from tests.final.fakes import (
    CAPACITY,
    OTHER_SLOT_ID,
    SLOT_ID,
    FakeFinalRepository,
    FakeFinalUoW,
)

ACTOR_ID = 3
TEAM_ID = 10


@pytest.fixture
def repo() -> FakeFinalRepository:
    repo = FakeFinalRepository()
    repo.teams = {TEAM_ID, 11, 12}
    return repo


@pytest.fixture
def uow(repo) -> FakeFinalUoW:
    return FakeFinalUoW(repo)


async def test_overview_groups_teams_by_slot(uow, repo):
    repo.bookings = {11: SLOT_ID}
    overview = await admin_get_final(uow)
    slot = next(s for s in overview.slots if s.id == SLOT_ID)
    assert [t.id for t in slot.teams] == [11]
    assert slot.booked == 1
    other = next(s for s in overview.slots if s.id == OTHER_SLOT_ID)
    assert other.teams == []
    assert sorted(t.id for t in overview.unbooked_teams) == [TEAM_ID, 12]


async def test_overview_reports_min_team_size(uow):
    overview = await admin_get_final(uow)
    assert overview.min_team_size == 5


async def test_admin_adds_team_even_after_deadline(uow, repo, monkeypatch):
    monkeypatch.setattr(
        settings, "FINAL_BOOKING_DEADLINE", dt.datetime(2000, 1, 1, tzinfo=tz)
    )
    overview = await admin_add_final_team(ACTOR_ID, SLOT_ID, TEAM_ID, uow)
    assert repo.bookings == {TEAM_ID: SLOT_ID}
    assert TEAM_ID not in [t.id for t in overview.unbooked_teams]


async def test_admin_cannot_overfill_slot(uow, repo):
    repo.bookings = {team_id: SLOT_ID for team_id in range(1000, 1000 + CAPACITY)}
    with pytest.raises(FinalSlotIsFull):
        await admin_add_final_team(ACTOR_ID, SLOT_ID, TEAM_ID, uow)
    assert TEAM_ID not in repo.bookings


async def test_admin_cannot_double_book_team(uow, repo):
    repo.bookings = {TEAM_ID: OTHER_SLOT_ID}
    with pytest.raises(TeamAlreadyBookedFinal):
        await admin_add_final_team(ACTOR_ID, SLOT_ID, TEAM_ID, uow)
    assert repo.bookings == {TEAM_ID: OTHER_SLOT_ID}


async def test_admin_add_unknown_team(uow):
    with pytest.raises(FinalTeamNotFound):
        await admin_add_final_team(ACTOR_ID, SLOT_ID, 999, uow)


async def test_admin_add_to_unknown_slot(uow):
    with pytest.raises(FinalSlotNotFound):
        await admin_add_final_team(ACTOR_ID, 999, TEAM_ID, uow)


async def test_admin_removes_team(uow, repo):
    repo.bookings = {TEAM_ID: SLOT_ID}
    overview = await admin_remove_final_team(ACTOR_ID, SLOT_ID, TEAM_ID, uow)
    assert repo.bookings == {}
    assert TEAM_ID in [t.id for t in overview.unbooked_teams]


async def test_admin_remove_from_wrong_slot_keeps_booking(uow, repo):
    repo.bookings = {TEAM_ID: SLOT_ID}
    with pytest.raises(FinalBookingNotFound):
        await admin_remove_final_team(ACTOR_ID, OTHER_SLOT_ID, TEAM_ID, uow)
    assert repo.bookings == {TEAM_ID: SLOT_ID}


class _FakeUser:
    id = ACTOR_ID

    def __init__(self, is_superuser: bool):
        self.is_superuser = is_superuser


def _client(is_superuser: bool, repo: FakeFinalRepository) -> TestClient:
    app = FastAPI()

    @app.exception_handler(AppException)
    async def app_exception_handler(_, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code, content={"error_code": exc.error_code}
        )

    @app.middleware("http")
    async def inject_user(request, call_next):
        request.state.user = _FakeUser(is_superuser)
        return await call_next(request)

    app.include_router(admin_final_api_router, prefix="/admin/final")
    app.dependency_overrides[get_final_uow] = lambda: FakeFinalUoW(repo)
    return TestClient(app)


@pytest.mark.parametrize(
    ("method", "path", "body"),
    [
        ("get", "/admin/final", None),
        ("post", f"/admin/final/slots/{SLOT_ID}/teams", {"team_id": TEAM_ID}),
        ("delete", f"/admin/final/slots/{SLOT_ID}/teams/{TEAM_ID}", None),
    ],
)
def test_non_superuser_is_rejected(repo, method, path, body):
    repo.bookings = {TEAM_ID: SLOT_ID}
    client = _client(is_superuser=False, repo=repo)
    response = client.request(method, path, json=body)
    assert response.status_code == 403
    assert repo.bookings == {TEAM_ID: SLOT_ID}


def test_superuser_adds_and_removes_via_api(repo):
    client = _client(is_superuser=True, repo=repo)
    added = client.post(
        f"/admin/final/slots/{SLOT_ID}/teams", json={"team_id": TEAM_ID}
    )
    assert added.status_code == 200
    slot = next(s for s in added.json()["slots"] if s["id"] == SLOT_ID)
    assert [t["id"] for t in slot["teams"]] == [TEAM_ID]

    removed = client.delete(f"/admin/final/slots/{SLOT_ID}/teams/{TEAM_ID}")
    assert removed.status_code == 200
    assert repo.bookings == {}
