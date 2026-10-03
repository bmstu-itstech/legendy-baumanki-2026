from sqlalchemy import delete, func, insert, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from src.final.domain.entities import FinalBooking, FinalSlot, FinalTeam
from src.final.domain.exceptions import FinalSlotNotFound, TeamAlreadyBookedFinal
from src.final.domain.interfaces.final_repo import IFinalRepository
from src.final.infra.db.orm import FinalBookingModel, FinalSlotModel
from src.profile.infra.db.orm import ProfileModel, TeamModel

# Капитан — отдельный алиас, чтобы не путать его с ProfileModel в подзапросе
# размера команды.
Captain = aliased(ProfileModel)


def _team_columns():
    size = (
        select(func.count())
        .where(ProfileModel.team_id == TeamModel.id)
        .correlate(TeamModel)
        .scalar_subquery()
    )
    return (
        TeamModel.id,
        TeamModel.name,
        TeamModel.public_code,
        size.label("size"),
        Captain.full_name.label("captain_name"),
        Captain.telegram.label("captain_telegram"),
    )


def _team_from_row(row) -> FinalTeam:
    return FinalTeam(
        id=row.id,
        name=row.name,
        public_code=row.public_code,
        size=row.size,
        captain_name=row.captain_name,
        captain_telegram=row.captain_telegram,
    )


class PGFinalRepository(IFinalRepository):
    def __init__(self, session: AsyncSession):
        super().__init__()
        self.session = session

    async def get_slots(self) -> list[FinalSlot]:
        booked = (
            select(func.count())
            .where(FinalBookingModel.slot_id == FinalSlotModel.id)
            .correlate(FinalSlotModel)
            .scalar_subquery()
        )
        stmt = select(FinalSlotModel, booked).order_by(
            FinalSlotModel.starts_at, FinalSlotModel.id
        )
        rows = (await self.session.execute(stmt)).all()
        return [self._to_domain(obj, count) for obj, count in rows]

    async def lock_slot(self, slot_id: int) -> FinalSlot:
        stmt = (
            select(FinalSlotModel).where(FinalSlotModel.id == slot_id).with_for_update()
        )
        obj = (await self.session.execute(stmt)).scalar_one_or_none()
        if obj is None:
            raise FinalSlotNotFound(detail=f"Final slot with id {slot_id} not found")
        # Считаем отдельным запросом уже ПОСЛЕ взятия блокировки: в READ
        # COMMITTED он увидит записи, закоммиченные конкурентом, который
        # держал блокировку до нас.
        count_stmt = select(func.count()).where(FinalBookingModel.slot_id == slot_id)
        booked = (await self.session.execute(count_stmt)).scalar_one()
        return self._to_domain(obj, booked)

    async def get_team_slot_id(self, team_id: int) -> int | None:
        stmt = select(FinalBookingModel.slot_id).where(
            FinalBookingModel.team_id == team_id
        )
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def create_booking(self, team_id: int, slot_id: int) -> None:
        stmt = insert(FinalBookingModel).values(team_id=team_id, slot_id=slot_id)
        try:
            await self.session.execute(stmt)
        except IntegrityError:
            # Параллельный запрос той же команды успел записаться первым.
            raise TeamAlreadyBookedFinal()

    async def delete_booking(self, team_id: int) -> bool:
        stmt = (
            delete(FinalBookingModel)
            .where(FinalBookingModel.team_id == team_id)
            .returning(FinalBookingModel.team_id)
        )
        deleted = (await self.session.execute(stmt)).scalar_one_or_none()
        return deleted is not None

    async def delete_slot_booking(self, slot_id: int, team_id: int) -> bool:
        stmt = (
            delete(FinalBookingModel)
            .where(
                FinalBookingModel.team_id == team_id,
                FinalBookingModel.slot_id == slot_id,
            )
            .returning(FinalBookingModel.team_id)
        )
        deleted = (await self.session.execute(stmt)).scalar_one_or_none()
        return deleted is not None

    async def team_exists(self, team_id: int) -> bool:
        stmt = select(TeamModel.id).where(TeamModel.id == team_id)
        return (await self.session.execute(stmt)).scalar_one_or_none() is not None

    async def get_bookings(self) -> list[FinalBooking]:
        stmt = (
            select(
                FinalBookingModel.slot_id,
                FinalBookingModel.created_at,
                *_team_columns(),
            )
            .join(TeamModel, TeamModel.id == FinalBookingModel.team_id)
            .join(Captain, Captain.user_id == TeamModel.leader_id)
            .order_by(FinalBookingModel.slot_id, FinalBookingModel.created_at)
        )
        rows = (await self.session.execute(stmt)).all()
        return [
            FinalBooking(
                slot_id=row.slot_id,
                booked_at=row.created_at,
                team=_team_from_row(row),
            )
            for row in rows
        ]

    async def get_unbooked_teams(self) -> list[FinalTeam]:
        stmt = (
            select(*_team_columns())
            .join(Captain, Captain.user_id == TeamModel.leader_id)
            .outerjoin(FinalBookingModel, FinalBookingModel.team_id == TeamModel.id)
            .where(FinalBookingModel.team_id.is_(None))
            .order_by(TeamModel.name, TeamModel.id)
        )
        rows = (await self.session.execute(stmt)).all()
        return [_team_from_row(row) for row in rows]

    @staticmethod
    def _to_domain(obj: FinalSlotModel, booked: int) -> FinalSlot:
        return FinalSlot(
            id=obj.id,
            starts_at=obj.starts_at,
            ends_at=obj.ends_at,
            capacity=obj.capacity,
            booked=booked,
        )
