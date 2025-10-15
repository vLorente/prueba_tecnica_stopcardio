#!/usr/bin/env python3
"""
Script para poblar la base de datos con datos de prueba.

Ejecutar con: uv run python scripts/seed_data.py

Este script crea usuarios de ejemplo para desarrollo y testing.
⚠️ SOLO PARA DESARROLLO - NO EJECUTAR EN PRODUCCIÓN
"""

import argparse
import asyncio
import sys
from pathlib import Path

# Agregar el directorio raíz al path para importar módulos de la app
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import select

from app.core.security import get_password_hash
from app.database import AsyncSessionLocal, init_db
from app.models.user import User, UserRole


async def clear_database(session) -> None:
    """
    Limpia todos los datos de la base de datos.

    Args:
        session: Sesión de base de datos
    """
    print("🗑️  Limpiando base de datos...")

    # Eliminar todos los usuarios
    result = await session.execute(select(User))
    users = result.scalars().all()

    for user in users:
        await session.delete(user)

    await session.commit()
    print(f"   ✓ Eliminados {len(users)} usuarios existentes")


async def create_users(session) -> dict[str, User]:
    """
    Crea usuarios de ejemplo.

    Args:
        session: Sesión de base de datos

    Returns:
        dict: Diccionario con los usuarios creados
    """
    print("\n👥 Creando usuarios...")

    users_data = [
        {
            "email": "admin@stopcardio.com",
            "full_name": "Administrador Principal",
            "password": "admin123",
            "role": UserRole.HR,
            "is_active": True,
        },
        {
            "email": "hr@stopcardio.com",
            "full_name": "María García",
            "password": "password123",
            "role": UserRole.HR,
            "is_active": True,
        },
        {
            "email": "hr2@stopcardio.com",
            "full_name": "Carlos Rodríguez",
            "password": "password123",
            "role": UserRole.HR,
            "is_active": True,
        },
        {
            "email": "employee1@stopcardio.com",
            "full_name": "Ana López",
            "password": "password123",
            "role": UserRole.EMPLOYEE,
            "is_active": True,
        },
        {
            "email": "employee2@stopcardio.com",
            "full_name": "Pedro Martínez",
            "password": "password123",
            "role": UserRole.EMPLOYEE,
            "is_active": True,
        },
        {
            "email": "employee3@stopcardio.com",
            "full_name": "Laura Fernández",
            "password": "password123",
            "role": UserRole.EMPLOYEE,
            "is_active": True,
        },
        {
            "email": "employee4@stopcardio.com",
            "full_name": "Javier Sánchez",
            "password": "password123",
            "role": UserRole.EMPLOYEE,
            "is_active": True,
        },
        {
            "email": "employee5@stopcardio.com",
            "full_name": "Carmen Ruiz",
            "password": "password123",
            "role": UserRole.EMPLOYEE,
            "is_active": True,
        },
        {
            "email": "inactive@stopcardio.com",
            "full_name": "Usuario Inactivo",
            "password": "password123",
            "role": UserRole.EMPLOYEE,
            "is_active": False,
        },
        # Usuarios de testing (mismos que en conftest.py)
        {
            "email": "hr@test.com",
            "full_name": "HR User",
            "password": "password123",
            "role": UserRole.HR,
            "is_active": True,
        },
        {
            "email": "employee@test.com",
            "full_name": "Employee User",
            "password": "password123",
            "role": UserRole.EMPLOYEE,
            "is_active": True,
        },
        {
            "email": "inactive@test.com",
            "full_name": "Inactive User",
            "password": "password123",
            "role": UserRole.EMPLOYEE,
            "is_active": False,
        },
    ]

    created_users = {}

    for user_data in users_data:
        password = user_data.pop("password")
        hashed_password = get_password_hash(password)

        user = User(**user_data, hashed_password=hashed_password)

        session.add(user)
        created_users[user_data["email"]] = user

        role_emoji = "👔" if user.role == UserRole.HR else "👤"
        status_emoji = "✓" if user.is_active else "✗"
        print(f"   {role_emoji} {status_emoji} {user.full_name} ({user.email})")

    await session.commit()

    print(f"\n   ✓ Creados {len(created_users)} usuarios")
    return created_users


async def seed_database(clear: bool = True) -> None:
    """
    Ejecuta el proceso completo de seed.

    Args:
        clear: Si True, limpia la base de datos antes de poblarla
    """
    print("=" * 80)
    print("🌱 SEED DATA - Sistema de Gestión de Fichajes y RRHH")
    print("=" * 80)

    # Inicializar la base de datos
    await init_db()

    async with AsyncSessionLocal() as session:
        try:
            # Limpiar base de datos si se solicita
            if clear:
                await clear_database(session)

            # Crear datos de prueba
            await create_users(session)

            print("\n" + "=" * 80)
            print("✅ Seed completado exitosamente!")
            print("=" * 80)

            # Mostrar credenciales de acceso
            print("\n📋 CREDENCIALES DE ACCESO:\n")

            print("👔 USUARIOS HR:")
            print("   • admin@stopcardio.com / admin123")
            print("   • hr@stopcardio.com / password123")
            print("   • hr2@stopcardio.com / password123")
            print("   • hr@test.com / password123")

            print("\n👤 USUARIOS EMPLEADOS:")
            print("   • employee1@stopcardio.com / password123")
            print("   • employee2@stopcardio.com / password123")
            print("   • employee3@stopcardio.com / password123")
            print("   • employee4@stopcardio.com / password123")
            print("   • employee5@stopcardio.com / password123")
            print("   • employee@test.com / password123")

            print("\n✗ USUARIOS INACTIVOS:")
            print("   • inactive@stopcardio.com / password123")
            print("   • inactive@test.com / password123")

            print("\n" + "=" * 80)
            print("💡 TIP: Usa estos usuarios para probar la API")
            print("   - Los usuarios HR pueden gestionar todos los recursos")
            print("   - Los empleados solo pueden ver/editar sus propios datos")
            print("   - Los usuarios inactivos no pueden hacer login")
            print("=" * 80)

        except Exception as e:
            print(f"\n❌ Error durante el seed: {e}")
            raise


async def main():
    """Función principal del script."""

    parser = argparse.ArgumentParser(description="Poblar base de datos con datos de prueba")
    parser.add_argument(
        "--no-clear", action="store_true", help="No limpiar la base de datos antes de poblarla"
    )

    args = parser.parse_args()

    # Confirmar si se va a limpiar la base de datos
    if not args.no_clear:
        print("\n⚠️  ADVERTENCIA: Este script eliminará todos los datos existentes.")
        response = input("¿Deseas continuar? (s/N): ")

        if response.lower() not in ["s", "si", "y", "yes"]:
            print("❌ Operación cancelada")
            return

    await seed_database(clear=not args.no_clear)


if __name__ == "__main__":
    asyncio.run(main())
