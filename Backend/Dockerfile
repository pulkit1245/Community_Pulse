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

# Copy and make entrypoint executable (done as root before user switch)
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Runtime env
ENV PORT=8000
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV ENABLE_ML_ROUTES=false

# Non-root user for security
RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app /entrypoint.sh
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT}/health')" || exit 1

# Start: migrations → seeding → uvicorn
CMD ["/entrypoint.sh"]
