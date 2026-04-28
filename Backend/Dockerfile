# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build deps (needed to compile asyncpg, psycopg2, scipy, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Create a virtual environment
RUN python -m venv /opt/venv

# Activate the virtual environment
ENV PATH="/opt/venv/bin:$PATH"

# Copy and install Python dependencies into the venv
COPY requirements.api.txt ./
RUN pip install --upgrade pip "setuptools<70.0.0" wheel \
    && pip install --no-cache-dir -r requirements.api.txt


# ─── Stage 2: Runtime ────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

WORKDIR /app

# Runtime system deps (libpq for asyncpg)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy the entire configured venv from the builder
COPY --from=builder /opt/venv /opt/venv

# Activate the venv in the runtime container
ENV PATH="/opt/venv/bin:$PATH"

# Copy application source
COPY . .

# Railway injects PORT at runtime; default 8000 for local docker run
ENV PORT=8000
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV ENABLE_ML_ROUTES=false

# Non-root user for security
RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app
USER appuser

# Health check — Increased start-period to 60s to allow NLP model and DB to load
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT}/health')" || exit 1

# Start: run migrations first, then start the API server
# Reduced to 1 worker to prevent database deadlocks during initialization
CMD alembic upgrade head && \
    uvicorn main:app \
      --host 0.0.0.0 \
      --port $PORT \
      --workers 1 \
      --log-level info
