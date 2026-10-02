from sqladmin import ModelView

from src.final.infra.db.orm import FinalBookingModel, FinalSlotModel


class FinalSlotAdmin(ModelView, model=FinalSlotModel):
    column_list = (
        FinalSlotModel.id,
        FinalSlotModel.starts_at,
        FinalSlotModel.ends_at,
        FinalSlotModel.capacity,
    )
    column_sortable_list = (FinalSlotModel.id, FinalSlotModel.starts_at)
    form_excluded_columns = (FinalSlotModel.bookings,)
    name = "Final slot"
    name_plural = "Final slots"


class FinalBookingAdmin(ModelView, model=FinalBookingModel):
    column_list = (
        FinalBookingModel.slot,
        FinalBookingModel.team_id,
        FinalBookingModel.team,
        FinalBookingModel.created_at,
    )
    column_sortable_list = (
        FinalBookingModel.slot_id,
        FinalBookingModel.team_id,
        FinalBookingModel.created_at,
    )
    column_formatters = {  # noqa: RUF012
        FinalBookingModel.team: lambda m, _: m.team.name if m.team else "",
    }
    name = "Final booking"
    name_plural = "Final bookings"
