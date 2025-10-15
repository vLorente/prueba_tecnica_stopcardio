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

from datetime import UTC, datetime, timedelta

from sqlmodel import select

from app.core.security import get_password_hash
from app.database import AsyncSessionLocal, init_db
from app.models.fichaje import Fichaje, FichajeStatus
from app.models.user import User, UserRole


async def clear_database(session) -> None:
    """
    Limpia todos los datos de la base de datos.

    Args:
        session: Sesión de base de datos
    """
    print("🗑️  Limpiando base de datos...")

    # Eliminar todos los fichajes
    result = await session.execute(select(Fichaje))
    fichajes = result.scalars().all()
    for fichaje in fichajes:
        await session.delete(fichaje)

    # Eliminar todos los usuarios
    result = await session.execute(select(User))
    users = result.scalars().all()

    for user in users:
        await session.delete(user)

    await session.commit()
    print(f"   ✓ Eliminados {len(fichajes)} fichajes y {len(users)} usuarios existentes")


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


async def create_fichajes(session, users: dict[str, User]) -> list[Fichaje]:
    """
    Crea fichajes de ejemplo para los empleados.

    Args:
        session: Sesión de base de datos
        users: Diccionario de usuarios creados

    Returns:
        list: Lista de fichajes creados
    """
    print("\n⏰ Creando fichajes de ejemplo...")

    # Obtener empleados (no HR)
    employees = [
        user for user in users.values() if user.role == UserRole.EMPLOYEE and user.is_active
    ]

    if not employees:
        print("   ⚠️  No hay empleados activos para crear fichajes")
        return []

    created_fichajes = []
    now = datetime.now(tz=UTC)

    # Crear fichajes de la semana actual para cada empleado
    for employee in employees[:3]:  # Solo para los primeros 3 empleados
        print(f"\n   📋 Fichajes para {employee.full_name}:")

        # Lunes a Viernes de esta semana
        for days_ago in range(4, -1, -1):  # 4 días atrás hasta hoy
            date = now - timedelta(days=days_ago)

            # Solo días laborables (lunes a viernes)
            if date.weekday() < 5:  # noqa: PLR2004 0=Lunes, 4=Viernes
                # Fichaje completo (entrada y salida)
                check_in_time = date.replace(hour=9, minute=0, second=0, microsecond=0)
                check_out_time = date.replace(hour=18, minute=0, second=0, microsecond=0)

                fichaje = Fichaje(
                    user_id=employee.id,  # type: ignore
                    check_in=check_in_time,
                    check_out=check_out_time,
                    status=FichajeStatus.VALID,
                )
                session.add(fichaje)
                created_fichajes.append(fichaje)

                day_name = ["Lun", "Mar", "Mié", "Jue", "Vie"][date.weekday()]
                print(f"      ✓ {day_name} {date.strftime('%d/%m')}: 09:00 - 18:00 (Válido)")

    # Crear un fichaje activo (solo entrada) para el primer empleado
    if employees:
        employee = employees[0]
        active_check_in = now.replace(hour=9, minute=0, second=0, microsecond=0)

        active_fichaje = Fichaje(
            user_id=employee.id,  # type: ignore
            check_in=active_check_in,
            status=FichajeStatus.VALID,
        )
        session.add(active_fichaje)
        created_fichajes.append(active_fichaje)

        print(f"\n   🟢 Fichaje activo para {employee.full_name}:")
        print(f"      ⏱️  Entrada: {active_check_in.strftime('%H:%M')} (sin salida)")

    # Crear un fichaje pendiente de corrección para el segundo empleado
    if len(employees) > 1:
        employee = employees[1]
        pending_date = now - timedelta(days=2)
        wrong_check_in = pending_date.replace(hour=10, minute=30, second=0, microsecond=0)
        wrong_check_out = pending_date.replace(hour=17, minute=0, second=0, microsecond=0)

        pending_fichaje = Fichaje(
            user_id=employee.id,  # type: ignore
            check_in=wrong_check_in,
            check_out=wrong_check_out,
            status=FichajeStatus.PENDING_CORRECTION,
            correction_reason="Olvidé fichar a tiempo, llegué a las 9:00",
            correction_requested_at=now - timedelta(hours=2),
        )
        session.add(pending_fichaje)
        created_fichajes.append(pending_fichaje)

        print(f"\n   ⏳ Fichaje pendiente para {employee.full_name}:")
        print(
            f"      ⚠️  {pending_date.strftime('%d/%m')}: 10:30 - 17:00 → Solicitud: 09:00 - 18:00"
        )

    # Crear un fichaje rechazado para el tercer empleado
    if len(employees) > 2:  # noqa: PLR2004
        employee = employees[2]
        rejected_date = now - timedelta(days=3)
        rejected_check_in = rejected_date.replace(hour=11, minute=0, second=0, microsecond=0)
        rejected_check_out = rejected_date.replace(hour=16, minute=0, second=0, microsecond=0)

        rejected_fichaje = Fichaje(
            user_id=employee.id,  # type: ignore
            check_in=rejected_check_in,
            check_out=rejected_check_out,
            status=FichajeStatus.REJECTED,
            correction_reason="Tuve una cita médica",
            correction_requested_at=now - timedelta(days=2),
            approval_notes="Necesitas presentar justificante médico",
            approved_at=now - timedelta(days=1),
        )
        session.add(rejected_fichaje)
        created_fichajes.append(rejected_fichaje)

        print(f"\n   ❌ Fichaje rechazado para {employee.full_name}:")
        print(
            f"      🚫 {rejected_date.strftime('%d/%m')}: Solicitud rechazada - Falta justificante"
        )

    await session.commit()

    print(f"\n   ✓ Creados {len(created_fichajes)} fichajes de ejemplo")
    return created_fichajes


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
            users = await create_users(session)

            # Crear fichajes de ejemplo
            await create_fichajes(session, users)

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
            print("\n💾 FICHAJES DE EJEMPLO:")
            print("   - Fichajes completos de la semana para 3 empleados")
            print("   - 1 fichaje activo (solo entrada, sin salida)")
            print("   - 1 fichaje pendiente de corrección (esperando aprobación HR)")
            print("   - 1 fichaje rechazado (con motivo de rechazo)")
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
