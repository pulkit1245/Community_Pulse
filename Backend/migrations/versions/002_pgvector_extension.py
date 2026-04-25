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
    # pgvector is required in production.
    # In local dev without the extension installed, this migration is skipped gracefully.
    conn = op.get_bind()
    try:
        conn.execute(sa.text("CREATE EXTENSION IF NOT EXISTS vector;"))
        conn.execute(sa.text("""
            ALTER TABLE needs ADD COLUMN IF NOT EXISTS embedding vector(1536);
            CREATE INDEX IF NOT EXISTS needs_embedding_idx ON needs
            USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
        """))
    except Exception as e:
        print(f"[SKIP] pgvector not available on this host ({e}). "
              "Install pgvector or use the Docker compose setup for full functionality.")
        conn.execute(sa.text("ROLLBACK"))


def downgrade():
    conn = op.get_bind()
    try:
        conn.execute(sa.text("ALTER TABLE needs DROP COLUMN IF EXISTS embedding;"))
        conn.execute(sa.text("DROP EXTENSION IF EXISTS vector;"))
    except Exception:
        pass