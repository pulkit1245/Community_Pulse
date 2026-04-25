"""
Test configuration.

Unit tests (test_ingest, test_matching, test_dispatch, test_stress) run without a DB.
Integration tests (test_auth) require a live PostgreSQL instance.

Run unit tests only:
    pytest tests/test_ingest.py tests/test_matching.py tests/test_dispatch.py tests/test_stress.py -v

Run all tests (needs DB):
    pytest -v
"""
import pytest
import pytest_asyncio
import uuid
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.security import create_access_token

TEST_DATABASE_URL = "postgresql+asyncpg://postgres:password@localhost:5432/disaster_relief_test"


# ──────────────────────────────────────────────────
# Integration-only fixtures (require live Postgres)
# ──────────────────────────────────────────────────

@pytest_asyncio.fixture(scope="session")
async def db_engine():
    """Create async engine — only called when an integration test requests it."""
    from app.core.database import Base
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db(db_engine):
    Session = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with Session() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_engine):
    """HTTP test client with DB dependency overridden."""
    from app.core.database import Base, get_db
    from main import app

    Session = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with Session() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


# ──────────────────────────────────────────────────
# Token fixtures (no DB needed)
# ──────────────────────────────────────────────────

@pytest.fixture
def admin_token():
    return create_access_token({"sub": str(uuid.uuid4()), "role": "admin"})


@pytest.fixture
def coordinator_token():
    return create_access_token({"sub": str(uuid.uuid4()), "role": "coordinator"})


@pytest.fixture
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}