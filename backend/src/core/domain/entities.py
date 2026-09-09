import datetime as dt
from zoneinfo import ZoneInfo

from pydantic import BaseModel, model_validator


class CustomModel(BaseModel):
    """Custom Base pydantic model"""

    @model_validator(mode="after")
    def normalize_datetimes(self) -> "CustomModel":
        """
        Normalize all datetime fields in the model.

        - If the datetime has a timezone, it will be converted to Europe/Moscow.
        - If no timezone is present, Europe/Moscow will be assigned.
        - Microseconds will be removed.
        """
        tz_moscow = ZoneInfo("Europe/Moscow")

        for field_name, value in self.__dict__.items():
            if isinstance(value, dt.datetime):
                if value.tzinfo:
                    value = value.astimezone(tz_moscow)
                else:
                    value = value.replace(tzinfo=tz_moscow)
                value = value.replace(microsecond=0)
                setattr(self, field_name, value)

        return self
