"""Tests for user CRUD endpoints."""

from fastapi import status
from httpx import AsyncClient

from app.models.user import User


class TestCreateUser:
    """Tests for POST /api/users endpoint."""

    async def test_create_employee_success(self, client: AsyncClient, hr_token: str):
        """Test creating employee user as HR."""
        response = await client.post(
            "/api/users",
            headers={"Authorization": f"Bearer {hr_token}"},
            json={
                "email": "newemployee@test.com",
                "full_name": "New Employee",
                "password": "securepass123",
                "role": "employee",
            },
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["email"] == "newemployee@test.com"
        assert data["full_name"] == "New Employee"
        assert data["role"] == "employee"
        assert data["is_active"] is True
        assert "hashed_password" not in data
        assert "id" in data

    async def test_create_hr_without_auth_fails(self, client: AsyncClient):
        """Test that creating HR user without auth fails."""
        response = await client.post(
            "/api/users",
            json={
                "email": "newhr@test.com",
                "full_name": "New HR",
                "password": "securepass123",
                "role": "hr",
            },
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_create_user_duplicate_email(
        self, client: AsyncClient, employee_user: User, hr_token: str
    ):
        """Test that creating user with existing email fails."""
        response = await client.post(
            "/api/users",
            headers={"Authorization": f"Bearer {hr_token}"},
            json={
                "email": "employee@test.com",
                "full_name": "Duplicate User",
                "password": "securepass123",
                "role": "employee",
            },
        )

        assert response.status_code == status.HTTP_409_CONFLICT

    async def test_create_user_invalid_email(self, client: AsyncClient, hr_token: str):
        """Test validation error for invalid email."""
        response = await client.post(
            "/api/users",
            headers={"Authorization": f"Bearer {hr_token}"},
            json={
                "email": "not-an-email",
                "full_name": "Test User",
                "password": "securepass123",
                "role": "employee",
            },
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    async def test_create_user_short_password(self, client: AsyncClient, hr_token: str):
        """Test validation error for password too short."""
        response = await client.post(
            "/api/users",
            headers={"Authorization": f"Bearer {hr_token}"},
            json={
                "email": "test@test.com",
                "full_name": "Test User",
                "password": "short",
                "role": "employee",
            },
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestListUsers:
    """Tests for GET /api/users endpoint."""

    number_of_users = 2

    async def test_list_users_as_hr(
        self, client: AsyncClient, hr_user: User, hr_token: str, employee_user: User
    ):
        """Test that HR can list all users."""
        response = await client.get("/api/users", headers={"Authorization": f"Bearer {hr_token}"})

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "users" in data
        assert len(data["users"]) >= self.number_of_users
        assert "total" in data
        assert "page" in data
        assert "page_size" in data

    async def test_list_users_as_employee_fails(self, client: AsyncClient, employee_token: str):
        """Test that employee cannot list users."""
        response = await client.get(
            "/api/users", headers={"Authorization": f"Bearer {employee_token}"}
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    async def test_list_users_with_pagination(self, client: AsyncClient, hr_token: str):
        """Test pagination parameters."""
        response = await client.get(
            "/api/users?skip=0&limit=1",
            headers={"Authorization": f"Bearer {hr_token}"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["users"]) <= 1

    async def test_list_users_filter_by_role(self, client: AsyncClient, hr_token: str):
        """Test filtering by role."""
        response = await client.get(
            "/api/users?role=hr", headers={"Authorization": f"Bearer {hr_token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        for user in data["users"]:
            assert user["role"] == "hr"

    async def test_list_users_no_auth(self, client: AsyncClient):
        """Test that unauthenticated request fails."""
        response = await client.get("/api/users")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestGetUser:
    """Tests for GET /api/users/{id} endpoint."""

    async def test_get_user_self(
        self, client: AsyncClient, employee_user: User, employee_token: str
    ):
        """Test that user can get their own profile."""
        response = await client.get(
            f"/api/users/{employee_user.id}",
            headers={"Authorization": f"Bearer {employee_token}"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == employee_user.id
        assert data["email"] == employee_user.email

    async def test_get_other_user_as_employee_fails(
        self, client: AsyncClient, employee_user: User, hr_user: User, employee_token: str
    ):
        """Test that employee cannot view other users."""
        response = await client.get(
            f"/api/users/{hr_user.id}",
            headers={"Authorization": f"Bearer {employee_token}"},
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    async def test_get_user_as_hr(self, client: AsyncClient, employee_user: User, hr_token: str):
        """Test that HR can view any user."""
        response = await client.get(
            f"/api/users/{employee_user.id}",
            headers={"Authorization": f"Bearer {hr_token}"},
        )

        assert response.status_code == status.HTTP_200_OK

    async def test_get_nonexistent_user(self, client: AsyncClient, hr_token: str):
        """Test getting non-existent user returns 404."""
        response = await client.get(
            "/api/users/99999", headers={"Authorization": f"Bearer {hr_token}"}
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestUpdateUser:
    """Tests for PUT /api/users/{id} endpoint."""

    async def test_update_user_as_hr(self, client: AsyncClient, employee_user: User, hr_token: str):
        """Test that HR can update any user."""
        response = await client.put(
            f"/api/users/{employee_user.id}",
            headers={"Authorization": f"Bearer {hr_token}"},
            json={"email": "updated@test.com", "full_name": "Updated Name"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == "updated@test.com"
        assert data["full_name"] == "Updated Name"

    async def test_update_user_as_employee_fails(
        self, client: AsyncClient, employee_user: User, employee_token: str
    ):
        """Test that employee cannot update users via PUT."""
        response = await client.put(
            f"/api/users/{employee_user.id}",
            headers={"Authorization": f"Bearer {employee_token}"},
            json={"full_name": "New Name"},
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    async def test_update_user_duplicate_email(
        self, client: AsyncClient, employee_user: User, hr_user: User, hr_token: str
    ):
        """Test that updating to existing email fails."""
        response = await client.put(
            f"/api/users/{employee_user.id}",
            headers={"Authorization": f"Bearer {hr_token}"},
            json={"email": hr_user.email},
        )

        assert response.status_code == status.HTTP_409_CONFLICT


class TestUpdateSelf:
    """Tests for PATCH /api/users/me endpoint."""

    async def test_update_self_success(
        self, client: AsyncClient, employee_user: User, employee_token: str
    ):
        """Test that user can update their own profile."""
        response = await client.patch(
            "/api/users/me",
            headers={"Authorization": f"Bearer {employee_token}"},
            json={"full_name": "Updated Self Name"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["full_name"] == "Updated Self Name"
        assert data["id"] == employee_user.id

    async def test_update_self_password(self, client: AsyncClient, employee_token: str):
        """Test updating own password."""
        response = await client.patch(
            "/api/users/me",
            headers={"Authorization": f"Bearer {employee_token}"},
            json={"password": "newpassword123"},
        )

        assert response.status_code == status.HTTP_200_OK

    async def test_update_self_no_auth(self, client: AsyncClient):
        """Test that unauthenticated request fails."""
        response = await client.patch("/api/users/me", json={"full_name": "New Name"})

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestChangePassword:
    """Tests for POST /api/users/change-password endpoint."""

    async def test_change_password_success(self, client: AsyncClient, employee_token: str):
        """Test successful password change."""
        response = await client.post(
            "/api/users/change-password",
            headers={"Authorization": f"Bearer {employee_token}"},
            json={"current_password": "password123", "new_password": "newsecurepass"},
        )

        assert response.status_code == status.HTTP_200_OK

    async def test_change_password_wrong_current(self, client: AsyncClient, employee_token: str):
        """Test password change with wrong current password."""
        response = await client.post(
            "/api/users/change-password",
            headers={"Authorization": f"Bearer {employee_token}"},
            json={
                "current_password": "wrongpassword",
                "new_password": "newsecurepass",
            },
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_change_password_short_new_password(
        self, client: AsyncClient, employee_token: str
    ):
        """Test validation error for short new password."""
        response = await client.post(
            "/api/users/change-password",
            headers={"Authorization": f"Bearer {employee_token}"},
            json={"current_password": "password123", "new_password": "short"},
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestDeleteUser:
    """Tests for DELETE /api/users/{id} endpoint."""

    async def test_delete_user_as_hr(self, client: AsyncClient, employee_user: User, hr_token: str):
        """Test that HR can delete users."""
        response = await client.delete(
            f"/api/users/{employee_user.id}",
            headers={"Authorization": f"Bearer {hr_token}"},
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT

    async def test_delete_user_as_employee_fails(
        self, client: AsyncClient, hr_user: User, employee_token: str
    ):
        """Test that employee cannot delete users."""
        response = await client.delete(
            f"/api/users/{hr_user.id}",
            headers={"Authorization": f"Bearer {employee_token}"},
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    async def test_delete_self_as_hr_fails(self, client: AsyncClient, hr_user: User, hr_token: str):
        """Test that HR cannot delete themselves."""
        response = await client.delete(
            f"/api/users/{hr_user.id}", headers={"Authorization": f"Bearer {hr_token}"}
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    async def test_delete_nonexistent_user(self, client: AsyncClient, hr_token: str):
        """Test deleting non-existent user returns 404."""
        response = await client.delete(
            "/api/users/99999", headers={"Authorization": f"Bearer {hr_token}"}
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
