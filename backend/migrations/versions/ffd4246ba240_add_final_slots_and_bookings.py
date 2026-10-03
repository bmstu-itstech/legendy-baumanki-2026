"""add final slots and bookings

Revision ID: ffd4246ba240
Revises: 374444fe9086
Create Date: 2026-10-02 21:00:00.000000

"""

import datetime as dt
from collections.abc import Sequence
from zoneinfo import ZoneInfo

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "ffd4246ba240"
down_revision: str | Sequence[str] | None = "374444fe9086"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

MSK = ZoneInfo("Europe/Moscow")
FINAL_DAY = dt.date(2026, 10, 5)
# Слоты финала: 12:00–12:50, 13:00–13:50, …, 19:00–19:50 по Москве.
SLOT_START_HOURS = range(12, 20)
SLOT_DURATION = dt.timedelta(minutes=50)
SLOT_CAPACITY = 8


def upgrade() -> None:
    """Upgrade schema."""
    final_slots = op.create_table(
        "final_slots",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("capacity", sa.Integer(), server_default="8", nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("final_slots_pkey")),
    )
    op.create_table(
        "final_bookings",
        sa.Column("team_id", sa.Integer(), nullable=False),
        sa.Column("slot_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["team_id"],
            ["teams.id"],
            name=op.f("final_bookings_team_id_fkey"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["slot_id"],
            ["final_slots.id"],
            name=op.f("final_bookings_slot_id_fkey"),
        ),
        sa.PrimaryKeyConstraint("team_id", name=op.f("final_bookings_pkey")),
    )
    op.create_index(
        op.f("final_bookings_slot_id_idx"), "final_bookings", ["slot_id"], unique=False
    )

    rows = []
    for hour in SLOT_START_HOURS:
        starts_at = dt.datetime.combine(FINAL_DAY, dt.time(hour), tzinfo=MSK)
        rows.append(
            {
                "starts_at": starts_at,
                "ends_at": starts_at + SLOT_DURATION,
                "capacity": SLOT_CAPACITY,
            }
        )
    op.bulk_insert(final_slots, rows)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("final_bookings_slot_id_idx"), table_name="final_bookings")
    op.drop_table("final_bookings")
    op.drop_table("final_slots")
