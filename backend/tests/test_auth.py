"""Tests for authentication endpoints."""

from datetime import timedelta

from fastapi import status
from httpx import AsyncClient

from app.core.security import create_access_token
from app.models.user import User


class TestLogin:
    """Tests for POST /api/auth/login endpoint."""

    async def test_login_success_employee(self, client: AsyncClient, employee_user: User):
        """Test successful login with employee credentials."""
        response = await client.post(
            "/api/auth/login",
            json={"email": "employee@test.com", "password": "password123"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert isinstance(data["access_token"], str)
        assert len(data["access_token"]) > 0

    async def test_login_success_hr(self, client: AsyncClient, hr_user: User):
        """Test successful login with HR credentials."""
        response = await client.post(
            "/api/auth/login",
            json={"email": "hr@test.com", "password": "password123"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_invalid_email(self, client: AsyncClient):
        """Test login with non-existent email."""
        response = await client.post(
            "/api/auth/login",
            json={"email": "nonexistent@test.com", "password": "password123"},
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "detail" in response.json()

    async def test_login_invalid_password(self, client: AsyncClient, employee_user: User):
        """Test login with incorrect password."""
        response = await client.post(
            "/api/auth/login",
            json={"email": "employee@test.com", "password": "wrongpassword"},
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "detail" in response.json()

    async def test_login_inactive_user(self, client: AsyncClient, inactive_user: User):
        """Test that inactive users cannot login."""
        response = await client.post(
            "/api/auth/login",
            json={"email": "inactive@test.com", "password": "password123"},
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "detail" in response.json()

    async def test_login_missing_email(self, client: AsyncClient):
        """Test login without email field."""
        response = await client.post("/api/auth/login", json={"password": "password123"})

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    async def test_login_missing_password(self, client: AsyncClient, employee_user: User):
        """Test login without password field."""
        response = await client.post("/api/auth/login", json={"email": "employee@test.com"})

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    async def test_login_empty_credentials(self, client: AsyncClient):
        """Test login with empty email and password."""
        response = await client.post("/api/auth/login", json={"email": "", "password": ""})

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    async def test_login_invalid_email_format(self, client: AsyncClient):
        """Test login with invalid email format."""
        response = await client.post(
            "/api/auth/login",
            json={"email": "not-an-email", "password": "password123"},
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestGetCurrentUser:
    """Tests for GET /api/auth/me endpoint."""

    async def test_get_me_success(
        self, client: AsyncClient, employee_user: User, employee_token: str
    ):
        """Test getting current user profile."""
        response = await client.get(
            "/api/auth/me", headers={"Authorization": f"Bearer {employee_token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == employee_user.id
        assert data["email"] == employee_user.email
        assert data["full_name"] == employee_user.full_name
        assert data["role"] == "employee"
        assert data["is_active"] is True
        assert "hashed_password" not in data

    async def test_get_me_hr(self, client: AsyncClient, hr_user: User, hr_token: str):
        """Test getting current user profile for HR user."""
        response = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {hr_token}"})

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["role"] == "hr"

    async def test_get_me_no_token(self, client: AsyncClient):
        """Test accessing /me without authentication token."""
        response = await client.get("/api/auth/me")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "detail" in response.json()

    async def test_get_me_invalid_token(self, client: AsyncClient):
        """Test accessing /me with invalid token."""
        response = await client.get(
            "/api/auth/me", headers={"Authorization": "Bearer invalid_token"}
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "detail" in response.json()

    async def test_get_me_malformed_header(self, client: AsyncClient):
        """Test accessing /me with malformed authorization header."""
        response = await client.get(
            "/api/auth/me", headers={"Authorization": "InvalidFormat token"}
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_get_me_expired_token(self, client: AsyncClient, employee_user: User):
        """Test accessing /me with expired token."""
        # Create a token that expires immediately
        expired_token = create_access_token(
            data={"sub": str(employee_user.id)}, expires_delta=timedelta(minutes=-1)
        )

        response = await client.get(
            "/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"}
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "detail" in response.json()

    async def test_get_me_inactive_user(self, client: AsyncClient, inactive_user: User):
        """Test that inactive user cannot access /me."""
        # Create token for inactive user
        token = create_access_token(data={"sub": str(inactive_user.id)})

        response = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert (
            "inactiv" in response.json()["detail"].lower()
        )  # Works with both "inactive" and "inactivo"


class TestLogout:
    """Tests for POST /api/auth/logout endpoint."""

    async def test_logout_success(self, client: AsyncClient, employee_token: str):
        """Test successful logout."""
        response = await client.post(
            "/api/auth/logout", headers={"Authorization": f"Bearer {employee_token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data

    async def test_logout_no_token(self, client: AsyncClient):
        """Test logout without authentication token."""
        response = await client.post("/api/auth/logout")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_logout_invalid_token(self, client: AsyncClient):
        """Test logout with invalid token."""
        response = await client.post(
            "/api/auth/logout", headers={"Authorization": "Bearer invalid_token"}
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
