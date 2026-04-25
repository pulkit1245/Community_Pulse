"""Audit log table

Revision ID: 003
Revises: 002
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'audit_log',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('action', sa.String(100), nullable=False, index=True),
        sa.Column('entity_type', sa.String(100), nullable=False, index=True),
        sa.Column('entity_id', sa.String(100), index=True),
        sa.Column('user_id', sa.String(100), index=True),
        sa.Column('details', postgresql.JSON, default={}),
        sa.Column('ip_address', sa.String(50)),
        sa.Column('created_at', sa.DateTime(timezone=True), index=True),
    )


def downgrade():
    op.drop_table('audit_log')