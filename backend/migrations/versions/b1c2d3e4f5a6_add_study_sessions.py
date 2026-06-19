"""add study_sessions table

Revision ID: b1c2d3e4f5a6
Revises: 3f8a21c90b44
Create Date: 2026-06-19 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'b1c2d3e4f5a6'
down_revision = '3f8a21c90b44'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'study_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=True),
        sa.Column('subject_name', sa.String(120), nullable=True),
        sa.Column('duration_minutes', sa.Integer(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_study_sessions_user_id', 'study_sessions', ['user_id'])


def downgrade():
    op.drop_index('ix_study_sessions_user_id', table_name='study_sessions')
    op.drop_table('study_sessions')
