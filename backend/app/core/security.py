"""
Módulo de seguridad - Autenticación y autorización.

Maneja el hashing de contraseñas, generación y validación de JWT tokens.
"""

from datetime import UTC, datetime, timedelta
from typing import Any

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
    Crea un token JWT de acceso.

    Args:
        data: Datos a incluir en el token
        expires_delta: Tiempo de expiración opcional

    Returns:
        str: Token JWT codificado
    """
    try:
        from jose import jwt
    except ImportError as exc:
        raise ImportError(
            "python-jose no está instalado. "
            "Instálalo con: uv add python-jose[cryptography]"
        ) from exc

    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(
            minutes=settings.access_token_expire_minutes
        )

    to_encode.update({"exp": expire})
    return jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.algorithm
    )



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
        dict: Payload del token

    Raises:
        JWTError: Si el token es inválido o expiró
    """
    try:
        from jose import JWTError, jwt
    except ImportError as exc:
        raise ImportError(
            "python-jose no está instalado. "
            "Instálalo con: uv add python-jose[cryptography]"
        ) from exc

    try:
        return jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )
    except JWTError:
        raise
