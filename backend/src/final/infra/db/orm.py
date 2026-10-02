import datetime as dt

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import BaseModel
from src.profile.infra.db.orm import TeamModel
from src.utils.datetimes import tz


class FinalSlotModel(BaseModel):
    __tablename__ = "final_slots"

    id: Mapped[int] = mapped_column(primary_key=True)

    starts_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    ends_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    capacity: Mapped[int] = mapped_column(nullable=False, server_default="8")

    bookings: Mapped[list["FinalBookingModel"]] = relationship(back_populates="slot")

    def __str__(self) -> str:
        starts_at = self.starts_at.astimezone(tz)
        ends_at = self.ends_at.astimezone(tz)
        return f"{starts_at:%d.%m %H:%M}–{ends_at:%H:%M}"


class FinalBookingModel(BaseModel):
    __tablename__ = "final_bookings"

    # team_id — первичный ключ: команда записана максимум на один слот.
    # CASCADE — когда из команды уходит последний участник, команда
    # удаляется (см. leave_team), а вместе с ней и её запись.
    team_id: Mapped[int] = mapped_column(
        ForeignKey(TeamModel.id, ondelete="CASCADE"), primary_key=True
    )

    slot_id: Mapped[int] = mapped_column(
        ForeignKey(FinalSlotModel.id), nullable=False, index=True
    )

    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    slot: Mapped[FinalSlotModel] = relationship(back_populates="bookings")

    team: Mapped[TeamModel] = relationship()
