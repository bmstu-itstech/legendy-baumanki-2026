import datetime as dt
from zoneinfo import ZoneInfo

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # После этого момента капитаны не могут ни записаться, ни отменить запись.
    FINAL_BOOKING_DEADLINE: dt.datetime = dt.datetime(
        2026, 10, 5, 10, 0, tzinfo=ZoneInfo("Europe/Moscow")
    )
    # Капитан может записать команду, только если в ней хотя бы столько
    # человек. Организатор из админки этот порог обходит.
    FINAL_TEAM_MIN_SIZE: int = 3


settings = Settings()
