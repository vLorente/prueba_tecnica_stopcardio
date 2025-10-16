# Manejo de Zonas Horarias en Fichajes

## 🌍 Estrategia de Zona Horaria

Este proyecto implementa un manejo correcto de zonas horarias para garantizar que los fichajes se muestren en la hora local del usuario, independientemente de dónde esté ubicado.

## 📋 Flujo de Datos

```
┌─────────────────┐
│   Backend API   │ → Envía fechas en UTC (ISO 8601)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Mapper      │ → Convierte strings a objetos Date
└────────┬────────┘   (Date automáticamente usa zona horaria local)
         │
         ▼
┌─────────────────┐
│  Frontend Model │ → Almacena como Date (interpretado en zona local)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Component     │ → Formatea usando zona horaria del navegador
└─────────────────┘
```

## 🔧 Implementación

### 1. Backend → Mapper

**Backend envía (UTC):**
```json
{
  "check_in": "2025-10-16T08:00:00Z",
  "check_out": "2025-10-16T17:00:00Z"
}
```

**Mapper convierte:**
```typescript
export function mapFichajeApiToFichaje(api: FichajeApi): Fichaje {
  return {
    checkIn: new Date(api.check_in),    // Date object en zona local
    checkOut: new Date(api.check_out)   // Date object en zona local
  };
}
```

### 2. Component → Template

**Uso del DatePipe directamente en el template:**

```typescript
// Component
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-fichajes',
  imports: [CommonModule, DatePipe],  // ← Importar DatePipe
  // ...
})
export class FichajesComponent {
  // No necesitas inject() ni métodos de formateo
  // El pipe se usa directamente en el template
}
```

```html
<!-- Template -->
<!-- Formatear fecha completa -->
<span>{{ fichaje.checkIn | date: 'dd/MM/yyyy' }}</span>

<!-- Formatear hora -->
<span>{{ fichaje.checkIn | date: 'HH:mm' }}</span>

<!-- Formatear fecha y hora -->
<span>{{ fichaje.checkIn | date: 'dd/MM/yyyy, HH:mm' }}</span>

<!-- Con valores opcionales -->
<span>{{ fichaje.checkOut ? (fichaje.checkOut | date: 'HH:mm') : '--' }}</span>
```

> **✅ Ventajas de usar DatePipe en el template**:
> - **Más simple**: No necesitas métodos intermedios en el component
> - **Declarativo**: El formato está visible en el template
> - **Automático**: Angular maneja la zona horaria automáticamente
> - **Consistente**: Comportamiento predecible en todos los navegadores
> - **Flexible**: Soporta múltiples formatos (dd/MM/yyyy, HH:mm, etc.)
> - **Type-safe**: Integración perfecta con TypeScript

## 📖 Ejemplos Prácticos

### Ejemplo 1: Usuario en Madrid (UTC+1)

**Backend envía:**
```
check_in: "2025-10-16T08:00:00Z"
```

**Usuario ve:**
```
Hora: 09:00
Fecha: 16/10/2025
```

### Ejemplo 2: Usuario en Canarias (UTC+0)

**Backend envía:**
```
check_in: "2025-10-16T08:00:00Z"
```

**Usuario ve:**
```
Hora: 08:00
Fecha: 16/10/2025
```

### Ejemplo 3: Usuario en Nueva York (UTC-4)

**Backend envía:**
```
check_in: "2025-10-16T08:00:00Z"
```

**Usuario ve:**
```
Hora: 04:00
Fecha: 16/10/2025
```

## ✅ Ventajas de este Enfoque

1. **Automático**: El navegador maneja la conversión de zona horaria
2. **Sin configuración**: No necesitamos almacenar la zona horaria del usuario
3. **Consistente**: Todas las fechas se manejan de la misma manera
4. **Flexible**: Funciona para usuarios en cualquier zona horaria
5. **Correcto**: Respeta horarios de verano/invierno automáticamente

## 🧪 Testing

Los tests están diseñados para ser independientes de la zona horaria:

```typescript
it('should format time correctly in user timezone', () => {
  const testDate = new Date('2025-10-16T14:30:00Z');
  const result = component.formatTime(testDate);
  // No esperamos una hora específica, sino el formato correcto
  expect(result).toMatch(/\d{1,2}:\d{2}/);
});
```

## ⚠️ Consideraciones Importantes

1. **Backend debe enviar siempre en UTC**: Esto es crítico para la consistencia
2. **ISO 8601**: Las fechas deben estar en formato ISO con 'Z' al final (ej: `2025-10-16T08:00:00Z`)
3. **Usar DatePipe de Angular**: Más confiable que los métodos nativos de JavaScript
4. **No conversiones manuales**: El DatePipe automáticamente usa la zona horaria del navegador
5. **Formatos consistentes**: Usar los formatos estándar de DatePipe (HH:mm, dd/MM/yyyy, etc.)

### ¿Por qué usar DatePipe en lugar de toLocaleString()?

Angular's DatePipe ofrece varias ventajas sobre los métodos nativos de JavaScript:

**✅ Con DatePipe (recomendado):**
```typescript
formatTime(date: Date): string {
  return this.datePipe.transform(date, 'HH:mm') || '';
}
```

**❌ Con toLocaleString (problemas potenciales):**
```typescript
formatTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  // Comportamiento puede variar entre navegadores
}
```

**Ventajas de DatePipe:**
- ✅ Comportamiento consistente en todos los navegadores
- ✅ Bien probado por el equipo de Angular
- ✅ Soporta pipes personalizados si es necesario
- ✅ Manejo automático y correcto de zonas horarias
- ✅ Formato predecible y documentado

**Flujo correcto con DatePipe:**
1. Backend envía: `"2025-10-16T08:00:00Z"` (UTC)
2. `new Date("2025-10-16T08:00:00Z")` crea objeto Date (interno en UTC)
3. `datePipe.transform(date, 'HH:mm')` formatea a zona local del navegador
4. Si el navegador está en España (UTC+2 en verano), muestra: `10:00`

## 🔍 Debugging

Para verificar la zona horaria del usuario y probar conversiones:

```typescript
// 1. Ver zona horaria del navegador
console.log('Zona horaria:', Intl.DateTimeFormat().resolvedOptions().timeZone);
// Ejemplo: "Europe/Madrid"

// 2. Ver offset en horas respecto a UTC
console.log('Offset UTC:', new Date().getTimezoneOffset() / 60 * -1);
// En España (verano): +2 horas

// 3. Probar conversión de fecha UTC
const utcDate = new Date('2025-10-16T08:00:00Z');
console.log('UTC String:', utcDate.toISOString());
// Salida: "2025-10-16T08:00:00.000Z"

console.log('Hora local:', utcDate.toLocaleTimeString('es-ES'));
// En España (verano): "10:00:00" (08:00 UTC + 2 horas)

console.log('Fecha y hora local:', utcDate.toLocaleString('es-ES'));
// En España: "16/10/2025, 10:00:00"

// 4. Comparar diferentes formatos
const testDate = new Date('2025-10-16T14:30:00Z');
console.log('ISO (UTC):', testDate.toISOString());
console.log('Local String:', testDate.toString());
console.log('Locale String:', testDate.toLocaleString('es-ES'));
```

### Test Manual en el Componente

Añade temporalmente en `ngOnInit`:

```typescript
async ngOnInit(): Promise<void> {
  // Test de zona horaria
  const testDate = new Date('2025-10-16T08:00:00Z');
  console.log('=== TIMEZONE DEBUG ===');
  console.log('Zona horaria:', Intl.DateTimeFormat().resolvedOptions().timeZone);
  console.log('Offset:', new Date().getTimezoneOffset() / 60 * -1, 'horas');
  console.log('UTC:', testDate.toISOString());
  console.log('Hora formateada:', this.formatTime(testDate));
  console.log('Fecha formateada:', this.formatDate(testDate));
  console.log('====================');
  
  await this.loadData();
}
```

## 📚 Referencias

- [MDN: Date.toLocaleString()](https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString)
- [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- [ISO 8601](https://es.wikipedia.org/wiki/ISO_8601)
