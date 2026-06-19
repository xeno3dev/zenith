"""add resources table

Revision ID: c3d4e5f6a7b8
Revises: b1c2d3e4f5a6
Create Date: 2026-06-19 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'c3d4e5f6a7b8'
down_revision = 'b1c2d3e4f5a6'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'resources',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('entity_type', sa.String(32), nullable=False),
        sa.Column('entity_id', sa.Integer(), nullable=False),
        sa.Column('original_name', sa.String(255), nullable=False),
        sa.Column('file_path', sa.String(512), nullable=False),
        sa.Column('mime_type', sa.String(128), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('anthropic_file_id', sa.String(128), nullable=True),
        sa.Column('extracted_text', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_resources_user_id', 'resources', ['user_id'])
    op.create_index('ix_resources_entity', 'resources', ['entity_type', 'entity_id'])


def downgrade():
    op.drop_index('ix_resources_entity', table_name='resources')
    op.drop_index('ix_resources_user_id', table_name='resources')
    op.drop_table('resources')
