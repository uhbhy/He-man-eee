"""add storage file id to moments

Revision ID: 9c5de3f47e10
Revises: 2164b42f05fe
Create Date: 2026-07-28 21:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9c5de3f47e10"
down_revision: Union[str, None] = "2164b42f05fe"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("moments", sa.Column("storage_file_id", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("moments", "storage_file_id")
