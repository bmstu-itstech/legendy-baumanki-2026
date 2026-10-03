import datetime as dt

from src.final.domain.entities import FinalBooking, FinalSlot, FinalTeam, TeamInfo
from src.final.domain.exceptions import FinalSlotNotFound
from src.final.domain.interfaces.final_repo import IFinalRepository
from src.final.domain.interfaces.final_uow import IFinalUnitOfWork
from src.final.domain.interfaces.team_provider import ITeamProvider
from src.utils.datetimes import tz

SLOT_ID = 100
OTHER_SLOT_ID = 101
CAPACITY = 8


def make_team(team_id: int) -> FinalTeam:
    return FinalTeam(
        id=team_id,
        name=f"team{team_id}",
        public_code=f"C{team_id:05d}",
        size=5,
        captain_name="Капитан",
        captain_telegram="cap",
    )


class FakeFinalRepository(IFinalRepository):
    def __init__(self):
        start = dt.datetime(2026, 10, 5, 12, tzinfo=tz)
        self.slots = {
            slot_id: (start + dt.timedelta(hours=i), CAPACITY)
            for i, slot_id in enumerate((SLOT_ID, OTHER_SLOT_ID))
        }
        # team_id -> slot_id
        self.bookings: dict[int, int] = {}
        # Команды, которые существуют в БД (для админских сценариев).
        self.teams: set[int] = set()

    def _slot(self, slot_id: int) -> FinalSlot:
        starts_at, capacity = self.slots[slot_id]
        return FinalSlot(
            id=slot_id,
            starts_at=starts_at,
            ends_at=starts_at + dt.timedelta(minutes=50),
            capacity=capacity,
            booked=sum(1 for s in self.bookings.values() if s == slot_id),
        )

    async def get_slots(self) -> list[FinalSlot]:
        return [self._slot(slot_id) for slot_id in self.slots]

    async def lock_slot(self, slot_id: int) -> FinalSlot:
        if slot_id not in self.slots:
            raise FinalSlotNotFound()
        return self._slot(slot_id)

    async def get_team_slot_id(self, team_id: int) -> int | None:
        return self.bookings.get(team_id)

    async def create_booking(self, team_id: int, slot_id: int) -> None:
        self.bookings[team_id] = slot_id

    async def delete_booking(self, team_id: int) -> bool:
        return self.bookings.pop(team_id, None) is not None

    async def delete_slot_booking(self, slot_id: int, team_id: int) -> bool:
        if self.bookings.get(team_id) != slot_id:
            return False
        del self.bookings[team_id]
        return True

    async def team_exists(self, team_id: int) -> bool:
        return team_id in self.teams or team_id in self.bookings

    async def get_bookings(self) -> list[FinalBooking]:
        booked_at = dt.datetime(2026, 10, 3, tzinfo=tz)
        return [
            FinalBooking(slot_id=slot_id, team=make_team(team_id), booked_at=booked_at)
            for team_id, slot_id in self.bookings.items()
        ]

    async def get_unbooked_teams(self) -> list[FinalTeam]:
        return [make_team(t) for t in sorted(self.teams - self.bookings.keys())]


class FakeFinalUoW(IFinalUnitOfWork):
    def __init__(self, repo: FakeFinalRepository):
        self.final = repo

    async def rollback(self) -> None:
        pass

    async def _commit(self) -> None:
        pass


class FakeTeamProvider(ITeamProvider):
    def __init__(self, teams: dict[int, TeamInfo]):
        self.teams = teams

    async def get_team(self, user_id: int) -> TeamInfo | None:
        return self.teams.get(user_id)
