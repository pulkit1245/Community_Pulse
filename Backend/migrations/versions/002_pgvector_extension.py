"""Enable pgvector extension for semantic deduplication

Revision ID: 002
Revises: 001
"""
from alembic import op
import sqlalchemy as sa

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    # Check if pgvector extension is available before attempting to use it
    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM pg_available_extensions WHERE name = 'vector'"
    ))
    has_pgvector = result.scalar() > 0

    if has_pgvector:
        conn.execute(sa.text("CREATE EXTENSION IF NOT EXISTS vector;"))
        conn.execute(sa.text("""
            ALTER TABLE needs ADD COLUMN IF NOT EXISTS embedding vector(1536);
            CREATE INDEX IF NOT EXISTS needs_embedding_idx ON needs
            USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
        """))
    else:
        print("[SKIP] pgvector extension is not available on this PostgreSQL instance. "
              "Semantic deduplication features will be disabled.")


def downgrade():
    conn = op.get_bind()
    try:
        conn.execute(sa.text("ALTER TABLE needs DROP COLUMN IF EXISTS embedding;"))
        conn.execute(sa.text("DROP EXTENSION IF EXISTS vector;"))
    except Exception:
        pass