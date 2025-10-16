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
from app.models.solicitud import Solicitud, SolicitudStatus, SolicitudTipo
from app.models.user import User, UserRole


async def clear_database(session) -> None:
    """
    Limpia todos los datos de la base de datos.

    Args:
        session: Sesión de base de datos
    """
    print("🗑️  Limpiando base de datos...")

    # Eliminar solicitudes (primero por foreign keys)
    result = await session.execute(select(Solicitud))
    solicitudes = result.scalars().all()
    for solicitud in solicitudes:
        await session.delete(solicitud)

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
    print(
        f"   ✓ Eliminados {len(solicitudes)} solicitudes, {len(fichajes)} fichajes y {len(users)} usuarios existentes"
    )


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
        # Valores propuestos para la corrección
        proposed_check_in = pending_date.replace(hour=9, minute=0, second=0, microsecond=0)
        proposed_check_out = pending_date.replace(hour=18, minute=0, second=0, microsecond=0)

        pending_fichaje = Fichaje(
            user_id=employee.id,  # type: ignore
            check_in=wrong_check_in,
            check_out=wrong_check_out,
            status=FichajeStatus.PENDING_CORRECTION,
            correction_reason="Olvidé fichar a tiempo, llegué a las 9:00 y salí a las 18:00",
            correction_requested_at=now - timedelta(hours=2),
            proposed_check_in=proposed_check_in,
            proposed_check_out=proposed_check_out,
        )
        session.add(pending_fichaje)
        created_fichajes.append(pending_fichaje)

        print(f"\n   ⏳ Fichaje pendiente para {employee.full_name}:")
        print(
            f"      ⚠️  {pending_date.strftime('%d/%m')}: 10:30 - 17:00 → Propuesta: 09:00 - 18:00"
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

    # Crear un fichaje corregido y aprobado para el cuarto empleado
    if len(employees) > 3:  # noqa: PLR2004
        employee = employees[3]
        corrected_date = now - timedelta(days=5)
        # Los valores finales (ya corregidos)
        corrected_check_in = corrected_date.replace(hour=9, minute=0, second=0, microsecond=0)
        corrected_check_out = corrected_date.replace(hour=18, minute=0, second=0, microsecond=0)

        corrected_fichaje = Fichaje(
            user_id=employee.id,  # type: ignore
            check_in=corrected_check_in,
            check_out=corrected_check_out,
            status=FichajeStatus.CORRECTED,
            correction_reason="Error al fichar, entré a las 9:00 no a las 10:00",
            correction_requested_at=now - timedelta(days=4),
            approval_notes="Corrección aprobada. Horario verificado con el supervisor.",
            approved_at=now - timedelta(days=3),
        )
        session.add(corrected_fichaje)
        created_fichajes.append(corrected_fichaje)

        print(f"\n   ✅ Fichaje corregido y aprobado para {employee.full_name}:")
        print(f"      ✔️  {corrected_date.strftime('%d/%m')}: 09:00 - 18:00 (Corrección aprobada)")

    await session.commit()

    print(f"\n   ✓ Creados {len(created_fichajes)} fichajes de ejemplo")
    return created_fichajes


async def create_solicitudes(session, users: dict[str, User]) -> list[Solicitud]:
    """
    Crea solicitudes de vacaciones/ausencias de ejemplo.

    Args:
        session: Sesión de base de datos
        users: Diccionario de usuarios creados

    Returns:
        list: Lista de solicitudes creadas
    """
    print("\n🏖️  Creando solicitudes de vacaciones y ausencias...")

    # Obtener empleados y HR
    employees = [
        user for user in users.values() if user.role == UserRole.EMPLOYEE and user.is_active
    ]
    hr_users = [user for user in users.values() if user.role == UserRole.HR and user.is_active]

    if not employees:
        print("   ⚠️  No hay empleados activos para crear solicitudes")
        return []

    if not hr_users:
        print("   ⚠️  No hay usuarios HR para aprobar solicitudes")
        return []

    created_solicitudes = []
    now = datetime.now(tz=UTC)
    hr_reviewer = hr_users[0]

    # Solicitudes aprobadas (pasadas)
    print("\n   ✅ Solicitudes aprobadas:")
    for i, employee in enumerate(employees[:3]):
        # Vacaciones aprobadas (pasadas)
        start_date = (now - timedelta(days=30 - i * 5)).date()
        end_date = (now - timedelta(days=25 - i * 5)).date()
        dias = (end_date - start_date).days + 1

        solicitud = Solicitud(
            user_id=employee.id,  # type: ignore
            tipo=SolicitudTipo.VACATION,
            fecha_inicio=start_date,
            fecha_fin=end_date,
            dias_solicitados=dias,
            motivo="Vacaciones de verano planificadas",
            status=SolicitudStatus.APPROVED,
            reviewed_by=hr_reviewer.id,  # type: ignore
            comentarios_revision="Aprobado. Disfruta tus vacaciones.",
            reviewed_at=now - timedelta(days=28 - i * 5),
        )
        session.add(solicitud)
        created_solicitudes.append(solicitud)

        print(f"      ✓ {employee.full_name}: Vacaciones {start_date} - {end_date} ({dias} días)")

    # Baja médica aprobada
    if len(employees) > 1:
        employee = employees[1]
        start_date = (now - timedelta(days=10)).date()
        end_date = (now - timedelta(days=8)).date()
        dias = (end_date - start_date).days + 1

        solicitud = Solicitud(
            user_id=employee.id,  # type: ignore
            tipo=SolicitudTipo.SICK_LEAVE,
            fecha_inicio=start_date,
            fecha_fin=end_date,
            dias_solicitados=dias,
            motivo="Gripe con fiebre alta",
            status=SolicitudStatus.APPROVED,
            reviewed_by=hr_reviewer.id,  # type: ignore
            comentarios_revision="Aprobado. Recupérate pronto.",
            reviewed_at=now - timedelta(days=9),
        )
        session.add(solicitud)
        created_solicitudes.append(solicitud)

        print(f"      ✓ {employee.full_name}: Baja médica {start_date} - {end_date} (3 días)")

    # Asunto personal aprobado
    if len(employees) > 2:  # noqa: PLR2004
        employee = employees[2]
        personal_date = (now - timedelta(days=5)).date()

        solicitud = Solicitud(
            user_id=employee.id,  # type: ignore
            tipo=SolicitudTipo.PERSONAL,
            fecha_inicio=personal_date,
            fecha_fin=personal_date,
            dias_solicitados=1,
            motivo="Trámites bancarios importantes",
            status=SolicitudStatus.APPROVED,
            reviewed_by=hr_reviewer.id,  # type: ignore
            comentarios_revision="Aprobado.",
            reviewed_at=now - timedelta(days=4),
        )
        session.add(solicitud)
        created_solicitudes.append(solicitud)

        print(f"      ✓ {employee.full_name}: Asunto personal {personal_date} (1 día)")

    # Solicitudes pendientes
    print("\n   ⏳ Solicitudes pendientes de revisión:")
    for i, employee in enumerate(employees[:4]):
        start_date = (now + timedelta(days=15 + i * 3)).date()
        end_date = (now + timedelta(days=18 + i * 3)).date()
        dias = (end_date - start_date).days + 1

        tipo = [
            SolicitudTipo.VACATION,
            SolicitudTipo.PERSONAL,
            SolicitudTipo.OTHER,
            SolicitudTipo.SICK_LEAVE,
        ][i]
        reasons = [
            "Visita familiar programada",
            "Gestión de documentación oficial",
            "Mudanza de vivienda",
            "Cita médica especialista",
        ]

        solicitud = Solicitud(
            user_id=employee.id,  # type: ignore
            tipo=tipo,
            fecha_inicio=start_date,
            fecha_fin=end_date,
            dias_solicitados=dias,
            motivo=reasons[i],
            status=SolicitudStatus.PENDING,
        )
        session.add(solicitud)
        created_solicitudes.append(solicitud)

        tipo_emoji = {"vacation": "🏖️", "personal": "📋", "other": "📝", "sick_leave": "🏥"}[
            tipo.value
        ]
        print(f"      {tipo_emoji} {employee.full_name}: {tipo.value} {start_date} - {end_date}")

    # Solicitudes rechazadas
    print("\n   ❌ Solicitudes rechazadas:")
    for i, employee in enumerate(employees[:3]):
        start_date = (now + timedelta(days=7 + i * 2)).date()
        end_date = (now + timedelta(days=9 + i * 2)).date()
        dias = (end_date - start_date).days + 1

        reasons_rejected = [
            "Vacaciones en período de alta demanda",
            "Necesito tiempo libre urgente",
            "Asunto personal importante",
        ]
        review_comments = [
            "No se pueden aprobar vacaciones en este período. Ya hay 3 empleados de baja.",
            "Necesitas solicitar con más antelación. Mínimo 15 días de anticipación.",
            "Por favor, proporciona más detalles sobre el motivo de la ausencia.",
        ]

        solicitud = Solicitud(
            user_id=employee.id,  # type: ignore
            tipo=SolicitudTipo.VACATION if i == 0 else SolicitudTipo.PERSONAL,
            fecha_inicio=start_date,
            fecha_fin=end_date,
            dias_solicitados=dias,
            motivo=reasons_rejected[i],
            status=SolicitudStatus.REJECTED,
            reviewed_by=hr_reviewer.id,  # type: ignore
            comentarios_revision=review_comments[i],
            reviewed_at=now - timedelta(hours=i + 1),
        )
        session.add(solicitud)
        created_solicitudes.append(solicitud)

        print(f"      🚫 {employee.full_name}: {solicitud.tipo.value} - {review_comments[i]}")

    # Solicitudes canceladas
    print("\n   ⚪ Solicitudes canceladas:")
    for i, employee in enumerate(employees[:2]):
        start_date = (now + timedelta(days=20 + i * 5)).date()
        end_date = (now + timedelta(days=22 + i * 5)).date()
        dias = (end_date - start_date).days + 1

        solicitud = Solicitud(
            user_id=employee.id,  # type: ignore
            tipo=SolicitudTipo.VACATION,
            fecha_inicio=start_date,
            fecha_fin=end_date,
            dias_solicitados=dias,
            motivo="Vacaciones canceladas por cambio de planes",
            status=SolicitudStatus.CANCELLED,
        )
        session.add(solicitud)
        created_solicitudes.append(solicitud)

        print(f"      ⭕ {employee.full_name}: Vacaciones {start_date} - {end_date} (cancelada)")

    # Solicitud futura aprobada
    if employees:
        employee = employees[0]
        start_date = (now + timedelta(days=45)).date()
        end_date = (now + timedelta(days=50)).date()
        dias = (end_date - start_date).days + 1

        solicitud = Solicitud(
            user_id=employee.id,  # type: ignore
            tipo=SolicitudTipo.VACATION,
            fecha_inicio=start_date,
            fecha_fin=end_date,
            dias_solicitados=dias,
            motivo="Vacaciones de fin de año",
            status=SolicitudStatus.APPROVED,
            reviewed_by=hr_reviewer.id,  # type: ignore
            comentarios_revision="Aprobado con antelación.",
            reviewed_at=now,
        )
        session.add(solicitud)
        created_solicitudes.append(solicitud)

        print(
            f"\n   🎯 Solicitud futura aprobada:\n      ✓ {employee.full_name}: Vacaciones {start_date} - {end_date} (6 días)"
        )

    await session.commit()

    print(f"\n   ✓ Creadas {len(created_solicitudes)} solicitudes de ejemplo")
    return created_solicitudes


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

            # Crear solicitudes de vacaciones
            await create_solicitudes(session, users)

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
            print("   - 1 fichaje pendiente de corrección con valores propuestos")
            print("     · proposed_check_in/proposed_check_out almacenan los valores solicitados")
            print("   - 1 fichaje rechazado (con motivo de rechazo)")
            print("   - 1 fichaje corregido y aprobado (corrección aplicada)")
            print("\n🏖️  SOLICITUDES DE VACACIONES:")
            print("   - 5 solicitudes aprobadas (vacaciones, bajas, permisos)")
            print("   - 4 solicitudes pendientes de revisión")
            print("   - 3 solicitudes rechazadas con comentarios")
            print("   - 2 solicitudes canceladas por empleados")
            print("   - 1 solicitud futura aprobada")
            print("=" * 80)

        except Exception as e:
            print(f"\n❌ Error durante el seed: {e}")
            raise


async def main():
    """Función principal del script."""

    parser = argparse.ArgumentParser(description="Poblar base de datos con datos de prueba")
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Limpiar la base de datos antes de poblarla (sin confirmación)",
    )
    parser.add_argument(
        "--no-clear", action="store_true", help="No limpiar la base de datos antes de poblarla"
    )

    args = parser.parse_args()

    # Determinar si se debe limpiar
    should_clear = False

    if args.clear and args.no_clear:
        print("❌ Error: No puedes usar --clear y --no-clear al mismo tiempo")
        return

    if args.clear:
        # Limpiar sin confirmación
        should_clear = True
    elif args.no_clear:
        # No limpiar
        should_clear = False
    else:
        # Por defecto, preguntar al usuario
        print("\n⚠️  ADVERTENCIA: Este script eliminará todos los datos existentes.")
        response = input("¿Deseas continuar? (s/N): ")

        if response.lower() not in ["s", "si", "y", "yes"]:
            print("❌ Operación cancelada")
            return

        should_clear = True

    await seed_database(clear=should_clear)


if __name__ == "__main__":
    asyncio.run(main())
