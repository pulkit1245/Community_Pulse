# Disaster Relief Backend

AI-powered disaster relief coordination API — needs ingestion, volunteer matching, and dispatch.

Built for **AI Social OS / Community Pulse** (Google Solution Challenge 2026).

---

## Tech Stack

| Layer | Technology |
|---|---|
| API | FastAPI (Python 3.12) |
| Database | PostgreSQL + pgvector |
| ORM | SQLAlchemy 2.0 (async) |
| Migrations | Alembic |
| Auth | JWT (python-jose) + bcrypt |
| Matching | scipy Hungarian algorithm |
| Messaging | Twilio SMS + WhatsApp Business API |
| Rate Limiting | slowapi |

---

## Quick Start

```bash
# 1. Create and activate virtual environment
python -m venv venv && source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL and optionally Twilio credentials

# 4. Run database migrations
alembic upgrade head

# 5. Seed base data (6 zones, 30 volunteers, 50 needs)
python -m seed.seed_base

# 6. (Optional) Seed demo scenarios
python -m seed.seed_demo

# 7. Start the server
python main.py
```

**API Docs:** http://localhost:8000/docs  
**Health:** http://localhost:8000/health

---

## Project Structure

```
disaster-relief-backend/
├── main.py                  # FastAPI app entry
├── requirements.txt
├── alembic.ini
├── .env.example
│
├── app/
│   ├── api/v1/              # Route handlers
│   │   ├── ingest.py        # POST /ingest (REST, WhatsApp, SMS webhooks)
│   │   ├── needs.py         # GET/PATCH /needs
│   │   ├── volunteers.py    # CRUD /volunteers
│   │   ├── match.py         # POST /match (Hungarian algorithm)
│   │   ├── tasks.py         # PATCH /tasks/{id}/status, dispatch
│   │   └── auth.py          # POST /auth/login
│   ├── core/
│   │   ├── config.py        # Settings (pydantic-settings)
│   │   ├── database.py      # Async SQLAlchemy engine + session
│   │   ├── security.py      # JWT + bcrypt
│   │   ├── rbac.py          # Role-based access (admin/coordinator/volunteer)
│   │   ├── audit.py         # Immutable audit log writer
│   │   └── rate_limit.py    # slowapi limiter config
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic request/response schemas
│   ├── services/            # Business logic
│   │   ├── ingestion.py     # Need ingestion + deduplication
│   │   ├── matching.py      # Bipartite matching engine
│   │   ├── dispatch.py      # WhatsApp/SMS notification
│   │   └── volunteer.py     # Volunteer CRUD
│   ├── integrations/
│   │   ├── twilio.py        # SMS send + signature verify
│   │   └── whatsapp.py      # WhatsApp webhook + signature verify
│   └── middleware/
│       ├── auth_middleware.py
│       ├── rate_limit_middleware.py
│       └── audit_middleware.py
│
├── migrations/              # Alembic migration scripts
├── seed/                    # Database seed scripts
├── tests/                   # Pytest test suite
└── docs/                    # OpenAPI spec + Postman collection
```

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Public | Login, get JWT |
| POST | `/api/v1/ingest` | Public | Ingest need via REST |
| POST | `/api/v1/ingest/whatsapp` | Webhook | WhatsApp message ingestion |
| POST | `/api/v1/ingest/sms` | Webhook | Twilio SMS ingestion |
| GET | `/api/v1/needs` | JWT | List needs (filterable) |
| PATCH | `/api/v1/needs/{id}` | Coordinator+ | Update need |
| GET | `/api/v1/volunteers` | JWT | List volunteers |
| POST | `/api/v1/volunteers` | Coordinator+ | Create volunteer |
| PATCH | `/api/v1/volunteers/{id}` | Self/Admin | Update volunteer |
| POST | `/api/v1/match` | Coordinator+ | Run matching algorithm |
| POST | `/api/v1/match/decline/{id}` | Coordinator+ | Decline + rematch |
| GET | `/api/v1/tasks` | JWT | List assignments |
| PATCH | `/api/v1/tasks/{id}/status` | JWT | Update task status |
| POST | `/api/v1/tasks/{id}/dispatch` | Coordinator+ | Send notification |
| GET | `/health` | Public | Health check |

---

## Roles & Permissions

| Role | Permissions |
|---|---|
| `admin` | read, write, delete, match, dispatch |
| `coordinator` | read, write, match, dispatch |
| `volunteer` | read, self_update |
| `viewer` | read |

---

## Running Tests

```bash
# Unit tests (no DB required)
pytest tests/test_ingest.py tests/test_matching.py tests/test_dispatch.py -v

# All tests (requires test DB)
pytest -v

# Stress / performance test
pytest tests/test_stress.py -v

# Load test with locust
locust -f tests/test_stress.py --headless -u 50 -r 10 --run-time 60s --host http://localhost:8000
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://...` | Async DB URL |
| `SYNC_DATABASE_URL` | `postgresql://...` | Sync DB URL (Alembic) |
| `SECRET_KEY` | `change-me` | JWT signing key |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Token TTL |
| `TWILIO_ACCOUNT_SID` | *(blank = mock)* | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | *(blank = mock)* | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | — | Your Twilio number |
| `WHATSAPP_FROM` | `whatsapp:+14155238886` | Twilio WhatsApp sender |
| `RATE_LIMIT_PER_MINUTE` | `60` | Global rate limit |

> When Twilio credentials are blank, SMS/WhatsApp calls are **mocked** and logged to console — no real messages sent.
