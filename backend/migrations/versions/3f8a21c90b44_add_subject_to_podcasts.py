"""add subject to podcasts

Revision ID: 3f8a21c90b44
Revises: 9140107220d5
Create Date: 2026-06-19 04:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3f8a21c90b44'
down_revision = '9140107220d5'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('podcasts', sa.Column('subject', sa.String(255), nullable=True))


def downgrade():
    op.drop_column('podcasts', 'subject')
