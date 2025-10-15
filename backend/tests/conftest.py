"""Pytest configuration and fixtures."""

import asyncio
from collections.abc import AsyncGenerator
from typing import Any

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

from app.api.dependencies.auth import (
    get_current_active_user,
    get_current_hr,
    get_current_user,
)
from app.core.security import create_access_token, get_password_hash
from app.database import get_session
from app.main import app
from app.models.user import User, UserRole

# Database URL para testing (SQLite en memoria)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# Engine para tests
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)

# Session factory para tests
# Session factory para tests
TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
async def setup_database():
    """Create all tables before each test and drop them after."""
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)


@pytest.fixture
async def session() -> AsyncGenerator[AsyncSession]:
    """Provide a test database session."""
    async with TestSessionLocal() as session:
        yield session


@pytest.fixture
async def client(session: AsyncSession) -> AsyncGenerator[AsyncClient, Any]:
    """Provide an async HTTP client for testing."""

    async def override_get_session() -> AsyncGenerator[AsyncSession]:
        yield session

    app.dependency_overrides[get_session] = override_get_session

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test", follow_redirects=True
    ) as client:
        yield client

    app.dependency_overrides.clear()


@pytest.fixture
async def employee_user(session: AsyncSession) -> User:
    """Create a test employee user."""
    user = User(
        email="employee@test.com",
        full_name="Test Employee",
        hashed_password=get_password_hash("password123"),
        role=UserRole.EMPLOYEE,
        is_active=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@pytest.fixture
async def hr_user(session: AsyncSession) -> User:
    """Create a test HR user."""
    user = User(
        email="hr@test.com",
        full_name="Test HR",
        hashed_password=get_password_hash("password123"),
        role=UserRole.HR,
        is_active=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@pytest.fixture
async def inactive_user(session: AsyncSession) -> User:
    """Create an inactive test user."""
    user = User(
        email="inactive@test.com",
        full_name="Inactive User",
        hashed_password=get_password_hash("password123"),
        role=UserRole.EMPLOYEE,
        is_active=False,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@pytest.fixture
def employee_token(employee_user: User) -> str:
    """Generate JWT token for employee user."""
    return create_access_token(data={"sub": str(employee_user.id)})


@pytest.fixture
def hr_token(hr_user: User) -> str:
    """Generate JWT token for HR user."""
    return create_access_token(data={"sub": str(hr_user.id)})


@pytest.fixture
async def authenticated_client(client: AsyncClient, employee_user: User) -> AsyncClient:
    """Provide an authenticated HTTP client (as employee)."""

    async def override_get_current_user():
        return employee_user

    app.dependency_overrides[get_current_active_user] = override_get_current_user
    app.dependency_overrides[get_current_user] = override_get_current_user
    return client


@pytest.fixture
async def hr_authenticated_client(client: AsyncClient, hr_user: User) -> AsyncClient:
    """Provide an authenticated HTTP client (as HR)."""

    async def override_get_current_user():
        return hr_user

    app.dependency_overrides[get_current_active_user] = override_get_current_user
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_current_hr] = override_get_current_user
    return client
