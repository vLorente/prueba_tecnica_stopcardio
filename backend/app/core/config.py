"""
Configuración de la aplicación.

Este módulo maneja todas las variables de entorno y configuraciones
de la aplicación siguiendo el patrón de Settings de Pydantic.
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Configuración de la aplicación.

    Lee las variables de entorno desde el archivo .env o del sistema.
    Utiliza Pydantic Settings para validación y tipos seguros.
    """

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=False, extra="ignore"
    )

    # Application
    app_name: str = Field(default="HR Management System", description="Nombre de la aplicación")
    app_version: str = Field(default="1.0.0", description="Versión de la aplicación")
    env: Literal["development", "production", "testing"] = Field(
        default="development", description="Entorno de ejecución"
    )
    debug: bool = Field(default=True, description="Modo debug")

    # Database
    database_url: str = Field(
        default="sqlite+aiosqlite:///./hr_dev.db", description="URL de conexión a la base de datos"
    )

    # Security
    secret_key: str = Field(
        default="dev_secret_key_change_in_production",
        description="Clave secreta para JWT y encriptación",
    )
    access_token_expire_minutes: int = Field(
        default=15, description="Tiempo de expiración del access token en minutos"
    )
    refresh_token_expire_days: int = Field(
        default=7, description="Tiempo de expiración del refresh token en días"
    )
    algorithm: str = Field(default="HS256", description="Algoritmo de encriptación JWT")

    # CORS
    allowed_origins: str = Field(
        default="http://localhost:3000,http://localhost:8000",
        description="Orígenes permitidos para CORS (separados por coma)",
    )

    @computed_field  # type: ignore[misc]
    @property
    def origins_list(self) -> list[str]:
        """Retorna la lista de orígenes permitidos para CORS."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    # Logging
    log_level: str = Field(default="INFO", description="Nivel de logging")

    @computed_field
    @property
    def is_development(self) -> bool:
        """Retorna True si está en modo desarrollo."""
        return self.env == "development"

    @computed_field
    @property
    def is_production(self) -> bool:
        """Retorna True si está en modo producción."""
        return self.env == "production"

    @computed_field
    @property
    def is_testing(self) -> bool:
        """Retorna True si está en modo testing."""
        return self.env == "testing"

    @computed_field
    @property
    def database_echo(self) -> bool:
        """Retorna True si debe mostrar las queries SQL."""
        return self.is_development and self.debug


@lru_cache
def get_settings() -> Settings:
    """
    Retorna la configuración de la aplicación.

    Usa lru_cache para crear una única instancia (Singleton).

    Returns:
        Settings: Instancia de configuración
    """
    return Settings()


# Instancia global de configuración
settings = get_settings()
