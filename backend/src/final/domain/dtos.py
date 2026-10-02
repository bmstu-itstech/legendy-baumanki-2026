import datetime as dt

from src.core.domain.entities import CustomModel


class FinalSlotDTO(CustomModel):
    id: int
    starts_at: dt.datetime
    ends_at: dt.datetime
    capacity: int
    booked: int


class FinalOverviewDTO(CustomModel):
    deadline: dt.datetime
    booking_open: bool
    has_team: bool
    is_captain: bool
    booked_slot_id: int | None
    # Размер команды пользователя (None — команды нет) и порог для записи.
    team_size: int | None
    min_team_size: int
    slots: list[FinalSlotDTO]


class AdminFinalTeamDTO(CustomModel):
    id: int
    name: str
    public_code: str
    size: int
    captain_name: str
    captain_telegram: str


class AdminFinalBookedTeamDTO(AdminFinalTeamDTO):
    booked_at: dt.datetime


class AdminFinalSlotDTO(FinalSlotDTO):
    teams: list[AdminFinalBookedTeamDTO]


class AdminFinalDTO(CustomModel):
    # Порог для записи капитаном — админка подсвечивает команды меньше него.
    min_team_size: int
    slots: list[AdminFinalSlotDTO]
    # Команды без записи — из них организатор выбирает, кого добавить в слот.
    unbooked_teams: list[AdminFinalTeamDTO]


class AdminFinalAddTeamDTO(CustomModel):
    team_id: int
