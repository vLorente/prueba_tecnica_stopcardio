"""
Módulo de seguridad - Autenticación y autorización.

Maneja el hashing de contraseñas, generación y validación de JWT tokens.
"""

from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from passlib.context import CryptContext

from app.core.config import settings

# Contexto de encriptación para passwords
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica que una contraseña en texto plano coincida con el hash.

    Args:
        plain_password: Contraseña en texto plano
        hashed_password: Contraseña hasheada

    Returns:
        bool: True si coinciden, False en caso contrario
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Genera un hash seguro de una contraseña.

    Args:
        password: Contraseña en texto plano

    Returns:
        str: Hash de la contraseña
    """
    return pwd_context.hash(password)


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """
    Crea un token de acceso JWT.

    Args:
        data: Datos a incluir en el token
        expires_delta: Tiempo de expiración del token

    Returns:
        str: Token JWT codificado
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)

    to_encode.update({"exp": expire})

    # PyJWT encode devuelve str directamente
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(data: dict[str, Any]) -> str:
    """
    Crea un token JWT de refresh.

    Args:
        data: Datos a incluir en el token

    Returns:
        str: Token JWT codificado
    """
    expires_delta = timedelta(days=settings.refresh_token_expire_days)
    return create_access_token(data, expires_delta)


def decode_token(token: str) -> dict[str, Any]:
    """
    Decodifica y valida un token JWT.

    Args:
        token: Token JWT a decodificar

    Returns:
        dict: Payload del token decodificado

    Raises:
        jwt.ExpiredSignatureError: Si el token ha expirado
        jwt.DecodeError: Si el token no puede ser decodificado
        jwt.InvalidTokenError: Si el token es inválido
    """
    # PyJWT decode devuelve dict directamente
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
