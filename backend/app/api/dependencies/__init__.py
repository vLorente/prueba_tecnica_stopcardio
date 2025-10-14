"""
Dependencies API.
"""

from app.api.dependencies.auth import (
    CurrentHR,
    CurrentUser,
    get_current_active_user,
    get_current_user,
    require_hr,
)

__all__ = [
    "CurrentHR",
    "CurrentUser",
    "get_current_active_user",
    "get_current_user",
    "require_hr",
]
