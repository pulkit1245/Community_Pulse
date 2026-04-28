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
COPY requirements.txt requirements.docker.txt ./
RUN pip install --upgrade pip "setuptools<70.0.0" wheel \
    && pip install --no-cache-dir -r requirements.docker.txt

# Download spaCy model directly into the venv during the build stage
RUN python -m spacy download en_core_web_sm


# ─── Stage 2: Runtime ────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

WORKDIR /app

# Runtime system deps (libpq for asyncpg, tesseract for OCR)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    tesseract-ocr \
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

# Non-root user for security
RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app
USER appuser

# Health check — Railway uses /health
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT}/health')" || exit 1

# Start: run migrations first, then start the API server
CMD alembic upgrade head && \
    uvicorn main:app \
      --host 0.0.0.0 \
      --port $PORT \
      --workers 2 \
      --log-level info