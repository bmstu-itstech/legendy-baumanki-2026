import datetime as dt

from src.core.domain.entities import CustomModel
from src.final.domain.exceptions import (
    FinalBookingClosed,
    FinalSlotIsFull,
    FinalTeamTooSmall,
)


class TeamInfo(CustomModel):
    id: int
    leader_id: int
    size: int

    def ensure_big_enough(self, min_size: int) -> None:
        if self.size < min_size:
            raise FinalTeamTooSmall(min_size=min_size, size=self.size)


class FinalSlot(CustomModel):
    id: int
    starts_at: dt.datetime
    ends_at: dt.datetime
    capacity: int
    # Сколько команд уже записано на слот.
    booked: int

    def ensure_has_place(self) -> None:
        if self.booked >= self.capacity:
            raise FinalSlotIsFull()


class FinalTeam(CustomModel):
    """Команда глазами организатора: кого и как искать в день финала."""

    id: int
    name: str
    public_code: str
    size: int
    captain_name: str
    captain_telegram: str


class FinalBooking(CustomModel):
    slot_id: int
    team: FinalTeam
    booked_at: dt.datetime


def ensure_booking_open(now: dt.datetime, deadline: dt.datetime) -> None:
    if now >= deadline:
        raise FinalBookingClosed()
