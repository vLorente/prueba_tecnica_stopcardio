"""
Excepciones personalizadas de la aplicación.

Define excepciones específicas del dominio siguiendo el principio
de diseño de excepciones explícitas.
"""

from typing import Any


class AppException(Exception):
    """Excepción base de la aplicación."""

    def __init__(self, message: str, details: dict[str, Any] | None = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class DatabaseException(AppException):
    """Excepción para errores de base de datos."""


class AuthenticationException(AppException):
    """Excepción para errores de autenticación."""


class AuthorizationException(AppException):
    """Excepción para errores de autorización."""


class ValidationException(AppException):
    """Excepción para errores de validación."""


class NotFoundException(AppException):
    """Excepción para recursos no encontrados."""


class ConflictException(AppException):
    """Excepción para conflictos (ej: email duplicado)."""
