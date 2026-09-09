import datetime as dt
from zoneinfo import ZoneInfo

tz = ZoneInfo("Europe/Moscow")


def get_timezone_now():
    return dt.datetime.now(tz)
