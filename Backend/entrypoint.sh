#!/bin/bash
set -e

echo "==> Running Alembic migrations..."
alembic upgrade head

echo "==> Running base seed..."
python -m seed.seed_base || echo "seed_base skipped (may already be seeded)"

echo "==> Running demo seed..."
python -m seed.seed_demo || echo "seed_demo skipped (may already be seeded)"

echo "==> Starting uvicorn on port ${PORT}..."
exec uvicorn main:app --host 0.0.0.0 --port "${PORT}" --workers 1 --log-level info
