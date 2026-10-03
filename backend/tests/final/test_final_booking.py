import datetime as dt

import pytest

from src.final.config import settings
from src.final.domain.entities import TeamInfo
from src.final.domain.exceptions import (
    FinalBookingClosed,
    FinalBookingNotFound,
    FinalSlotIsFull,
    FinalTeamTooSmall,
    TeamAlreadyBookedFinal,
    UserIsNotInTeam,
    UserIsNotTeamLeader,
)
from src.final.usecases import book_final_slot, cancel_final_booking, get_final
from src.utils.datetimes import tz
from tests.final.fakes import (
    CAPACITY,
    OTHER_SLOT_ID,
    SLOT_ID,
    FakeFinalRepository,
    FakeFinalUoW,
    FakeTeamProvider,
)

CAPTAIN_ID = 1
MEMBER_ID = 2
TEAM_ID = 10


TEAM = TeamInfo(id=TEAM_ID, leader_id=CAPTAIN_ID, size=5)


@pytest.fixture
def repo() -> FakeFinalRepository:
    return FakeFinalRepository()


@pytest.fixture
def uow(repo) -> FakeFinalUoW:
    return FakeFinalUoW(repo)


@pytest.fixture
def teams() -> FakeTeamProvider:
    return FakeTeamProvider({CAPTAIN_ID: TEAM, MEMBER_ID: TEAM})


@pytest.fixture(autouse=True)
def booking_open(monkeypatch):
    monkeypatch.setattr(
        settings, "FINAL_BOOKING_DEADLINE", dt.datetime(2100, 1, 1, tzinfo=tz)
    )


def close_booking(monkeypatch):
    monkeypatch.setattr(
        settings, "FINAL_BOOKING_DEADLINE", dt.datetime(2000, 1, 1, tzinfo=tz)
    )


async def test_captain_books_slot(uow, repo, teams):
    overview = await book_final_slot(CAPTAIN_ID, SLOT_ID, uow, teams)
    assert repo.bookings == {TEAM_ID: SLOT_ID}
    assert overview.booked_slot_id == SLOT_ID
    assert overview.is_captain
    slot = next(s for s in overview.slots if s.id == SLOT_ID)
    assert slot.booked == 1


async def test_member_cannot_book(uow, repo, teams):
    with pytest.raises(UserIsNotTeamLeader):
        await book_final_slot(MEMBER_ID, SLOT_ID, uow, teams)
    assert repo.bookings == {}


async def test_user_without_team_cannot_book(uow, teams):
    with pytest.raises(UserIsNotInTeam):
        await book_final_slot(999, SLOT_ID, uow, teams)


async def test_full_slot_is_rejected(uow, repo, teams):
    repo.bookings = {team_id: SLOT_ID for team_id in range(1000, 1000 + CAPACITY)}
    with pytest.raises(FinalSlotIsFull):
        await book_final_slot(CAPTAIN_ID, SLOT_ID, uow, teams)
    assert TEAM_ID not in repo.bookings


async def test_slot_with_one_place_left_accepts(uow, repo, teams):
    repo.bookings = {team_id: SLOT_ID for team_id in range(1000, 1000 + CAPACITY - 1)}
    await book_final_slot(CAPTAIN_ID, SLOT_ID, uow, teams)
    assert repo.bookings[TEAM_ID] == SLOT_ID


async def test_second_booking_requires_cancel(uow, repo, teams):
    await book_final_slot(CAPTAIN_ID, SLOT_ID, uow, teams)
    with pytest.raises(TeamAlreadyBookedFinal):
        await book_final_slot(CAPTAIN_ID, OTHER_SLOT_ID, uow, teams)
    assert repo.bookings == {TEAM_ID: SLOT_ID}


async def test_cancel_then_rebook(uow, repo, teams):
    await book_final_slot(CAPTAIN_ID, SLOT_ID, uow, teams)
    overview = await cancel_final_booking(CAPTAIN_ID, uow, teams)
    assert overview.booked_slot_id is None
    assert repo.bookings == {}
    await book_final_slot(CAPTAIN_ID, OTHER_SLOT_ID, uow, teams)
    assert repo.bookings == {TEAM_ID: OTHER_SLOT_ID}


async def test_member_cannot_cancel(uow, repo, teams):
    repo.bookings = {TEAM_ID: SLOT_ID}
    with pytest.raises(UserIsNotTeamLeader):
        await cancel_final_booking(MEMBER_ID, uow, teams)
    assert repo.bookings == {TEAM_ID: SLOT_ID}


async def test_cancel_without_booking(uow, teams):
    with pytest.raises(FinalBookingNotFound):
        await cancel_final_booking(CAPTAIN_ID, uow, teams)


async def test_booking_closed_after_deadline(uow, repo, teams, monkeypatch):
    close_booking(monkeypatch)
    with pytest.raises(FinalBookingClosed):
        await book_final_slot(CAPTAIN_ID, SLOT_ID, uow, teams)
    assert repo.bookings == {}


async def test_cancel_closed_after_deadline(uow, repo, teams, monkeypatch):
    repo.bookings = {TEAM_ID: SLOT_ID}
    close_booking(monkeypatch)
    with pytest.raises(FinalBookingClosed):
        await cancel_final_booking(CAPTAIN_ID, uow, teams)
    assert repo.bookings == {TEAM_ID: SLOT_ID}


async def test_member_sees_team_booking(uow, repo, teams, monkeypatch):
    repo.bookings = {TEAM_ID: SLOT_ID}
    close_booking(monkeypatch)
    overview = await get_final(MEMBER_ID, uow, teams)
    assert overview.has_team
    assert not overview.is_captain
    assert not overview.booking_open
    assert overview.booked_slot_id == SLOT_ID


async def test_overview_without_team(uow, teams):
    overview = await get_final(999, uow, teams)
    assert not overview.has_team
    assert not overview.is_captain
    assert overview.booked_slot_id is None
    assert [s.id for s in overview.slots] == [SLOT_ID, OTHER_SLOT_ID]


def team_of(size: int) -> FakeTeamProvider:
    team = TeamInfo(id=TEAM_ID, leader_id=CAPTAIN_ID, size=size)
    return FakeTeamProvider({CAPTAIN_ID: team, MEMBER_ID: team})


async def test_small_team_cannot_book(uow, repo):
    with pytest.raises(FinalTeamTooSmall) as exc:
        await book_final_slot(CAPTAIN_ID, SLOT_ID, uow, team_of(4))
    assert exc.value.extra == {"min_size": 5, "size": 4}
    assert repo.bookings == {}


async def test_team_of_min_size_can_book(uow, repo):
    await book_final_slot(CAPTAIN_ID, SLOT_ID, uow, team_of(5))
    assert repo.bookings == {TEAM_ID: SLOT_ID}


async def test_shrunk_team_can_still_cancel(uow, repo):
    """Если после записи команда стала меньше порога — отменить запись можно."""
    repo.bookings = {TEAM_ID: SLOT_ID}
    await cancel_final_booking(CAPTAIN_ID, uow, team_of(1))
    assert repo.bookings == {}


async def test_overview_reports_team_size(uow):
    overview = await get_final(MEMBER_ID, uow, team_of(4))
    assert overview.team_size == 4
    assert overview.min_team_size == 5
    no_team = await get_final(999, uow, team_of(4))
    assert no_team.team_size is None
