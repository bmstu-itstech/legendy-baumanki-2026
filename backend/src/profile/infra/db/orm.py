import datetime as dt

from sqlalchemy import ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.base import BaseModel


class TeamModel(BaseModel):
    __tablename__ = "teams"

    id: Mapped[int] = mapped_column(primary_key=True)

    public_code: Mapped[str] = mapped_column(
        String(6),
        nullable=False,
        unique=True,
    )

    name: Mapped[str] = mapped_column(
        String(127),
        nullable=False,
    )

    leader_id: Mapped[int] = mapped_column(
        ForeignKey("profiles.user_id"),
    )

    # lazy="selectin" — обращения к этим связям (Team._to_domain и
    # _to_domain_with_members) неявные, а дефолтный lazy="select" требует
    # синхронного greenlet-контекста и падает с MissingGreenlet на
    # AsyncSession.
    leader: Mapped["ProfileModel"] = relationship(
        back_populates="leader_of",
        foreign_keys="TeamModel.leader_id",
        lazy="selectin",
    )

    members: Mapped[list["ProfileModel"]] = relationship(
        back_populates="team",
        foreign_keys="ProfileModel.team_id",
        lazy="selectin",
    )

    created_at: Mapped[dt.datetime] = mapped_column(
        server_default=func.now(),
    )

    updated_at: Mapped[dt.datetime] = mapped_column(
        server_default=func.now(),
        onupdate=func.now(),
    )


class ProfileModel(BaseModel):
    __tablename__ = "profiles"

    user_id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=False,
    )

    full_name: Mapped[str] = mapped_column(
        String(127),
        nullable=False,
    )

    group: Mapped[str] = mapped_column(
        String(31),
        nullable=False,
    )

    telegram: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
    )

    team_id: Mapped[int | None] = mapped_column(
        ForeignKey(TeamModel.id),
        nullable=True,
    )

    team: Mapped[TeamModel | None] = relationship(
        back_populates="members",
        foreign_keys=team_id,
    )

    leader_of: Mapped[TeamModel | None] = relationship(
        back_populates="leader",
        foreign_keys=TeamModel.leader_id,
    )

    updated_at: Mapped[dt.datetime] = mapped_column(
        server_default=func.now(),
        onupdate=func.now(),
    )
