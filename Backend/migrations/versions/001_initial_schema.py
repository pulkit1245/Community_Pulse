"""Initial schema — zones, needs, volunteers, assignments

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'zones',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False, unique=True),
        sa.Column('description', sa.String(500)),
        sa.Column('latitude', sa.Float),
        sa.Column('longitude', sa.Float),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True)),
    )

    op.create_table(
        'volunteers',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('phone', sa.String(20), nullable=False, unique=True),
        sa.Column('email', sa.String(200)),
        sa.Column('skills', postgresql.JSON),
        sa.Column('zone_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('zones.id'), nullable=False),
        sa.Column('is_available', sa.Boolean, default=True),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('bio', sa.Text),
        sa.Column('languages', postgresql.JSON),
        sa.Column('hashed_password', sa.String(200)),
        sa.Column('role', sa.String(50), default='volunteer'),
        sa.Column('total_assignments', sa.Integer, default=0),
        sa.Column('completed_assignments', sa.Integer, default=0),
        sa.Column('created_at', sa.DateTime(timezone=True)),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
    )

    op.create_table(
        'needs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('category', sa.String(100), nullable=False),
        sa.Column('urgency', sa.String(20), default='medium'),
        sa.Column('status', sa.String(30), default='open'),
        sa.Column('zone_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('zones.id'), nullable=False),
        sa.Column('requester_name', sa.String(200)),
        sa.Column('requester_phone', sa.String(20)),
        sa.Column('skills_required', postgresql.JSON),
        sa.Column('source', sa.String(50), default='api'),
        sa.Column('embedding_hash', sa.String(64), index=True),
        sa.Column('people_count', sa.Integer, default=1),
        sa.Column('created_at', sa.DateTime(timezone=True)),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
    )

    op.create_table(
        'assignments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('need_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('needs.id'), nullable=False),
        sa.Column('volunteer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('volunteers.id'), nullable=False),
        sa.Column('status', sa.String(30), default='pending'),
        sa.Column('match_score', sa.Float),
        sa.Column('notes', sa.Text),
        sa.Column('decline_reason', sa.String(500)),
        sa.Column('notification_sent_at', sa.DateTime(timezone=True)),
        sa.Column('accepted_at', sa.DateTime(timezone=True)),
        sa.Column('completed_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True)),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
    )


def downgrade():
    op.drop_table('assignments')
    op.drop_table('needs')
    op.drop_table('volunteers')
    op.drop_table('zones')