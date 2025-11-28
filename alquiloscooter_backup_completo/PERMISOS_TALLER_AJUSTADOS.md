
# Ajuste de Permisos para Rol Taller

## Fecha
20 de octubre de 2025

## Problema Identificado

El rol "taller" tenía acceso a funcionalidades que no debería poder usar:
1. Podía ver y editar fichas de clientes
2. Tenía acceso a gastos generales
3. Podía ver reportes
4. Tenía acceso a documentos
5. Podía ver notificaciones
6. Al crear mantenimientos, aparecían "talleres demo" en lugar de los talleres reales del sistema

## Solución Implementada

### 1. Restricción de Accesos en el Menú (sidebar.tsx)

Se eliminó el rol "taller" de los siguientes menús:
- ❌ **Clientes** - Solo: super_admin, admin, operador
- ❌ **Gastos** - Solo: super_admin, admin, propietario, colaborador
- ❌ **Reportes** - Solo: super_admin, admin, propietario, colaborador
- ❌ **Documentos** - Solo: super_admin, admin, propietario, colaborador
- ❌ **Notificaciones** - Solo: super_admin, admin, operador
- ❌ **Comisiones** - Solo: super_admin, admin, propietario, colaborador

### 2. Permisos Mantenidos para Taller

El rol "taller" **SÍ puede acceder a**:
- ✅ **Dashboard** - Vista general
- ✅ **Vehículos** - Ver vehículos asignados a su ubicación
- ✅ **Mantenimiento** - Gestionar mantenimientos
- ✅ **Catálogo de Repuestos** - Usar el catálogo para mantenimientos
- ✅ **Ubicaciones** - Ver ubicaciones de taller

### 3. Middleware Actualizado

Se añadieron reglas específicas en el middleware para proteger las rutas:

```typescript
const PROTECTED_ROUTES: Record<string, string[]> = {
  '/customers': ['super_admin', 'admin', 'operador'],
  '/expenses': ['super_admin', 'admin', 'propietario', 'colaborador'],
  '/reports': ['super_admin', 'admin', 'propietario', 'colaborador'],
  '/documents': ['super_admin', 'admin', 'propietario', 'colaborador'],
  '/notifications': ['super_admin', 'admin', 'operador'],
  '/commissions': ['super_admin', 'admin', 'propietario', 'colaborador'],
  '/spare-parts': ['super_admin', 'admin', 'taller'],
  '/locations': ['super_admin', 'admin', 'taller'],
  '/maintenance': ['super_admin', 'admin', 'technician', 'taller', 'propietario', 'colaborador'],
  '/vehicles': ['super_admin', 'admin', 'propietario', 'colaborador', 'operador', 'taller'],
};
```

### 4. Sistema de Talleres Corregido

**Problema:** La API de workshops estaba usando la tabla antigua `car_rental_workshops` que contenía talleres demo.

**Solución:** Se modificó la API para usar `business_locations` con `type = 'workshop'`:

#### Archivos modificados:

1. **`/api/workshops/route.ts`**
   - GET: Ahora devuelve ubicaciones de negocio tipo "workshop" activas
   - POST: Crea nuevos talleres en BusinessLocations
   - Incluye información del usuario asociado al taller

2. **`/api/workshops/[id]/route.ts`**
   - GET: Obtiene taller específico desde BusinessLocations
   - PUT: Actualiza talleres en BusinessLocations
   - DELETE: Desactiva talleres (soft delete)

#### Estructura de Datos:

```typescript
{
  id: number,
  name: string,
  type: 'workshop',
  address: string,
  city: string,
  contact_person: string,
  contact_phone: string,
  contact_email: string,
  user_id: number,  // Usuario "taller" asociado
  user: {
    id: number,
    firstname: string,
    lastname: string,
    email: string
  }
}
```

## Flujo de Trabajo para Talleres

### Desde Central (Admin/Super Admin):

1. Seleccionar vehículo que necesita mantenimiento
2. Abrir nuevo mantenimiento
3. Indicar qué necesita el vehículo
4. **Asignar a qué taller va** (ahora aparecen los talleres reales)
5. Guardar mantenimiento

### Desde Taller:

1. Ver vehículos asignados a su ubicación
2. Ver mantenimientos pendientes/asignados
3. Abrir ficha de mantenimiento
4. Ver detalles del vehículo y qué necesita
5. Usar catálogo de repuestos para añadir líneas de detalle
6. Registrar precios y costes
7. Actualizar estado del mantenimiento

## Archivos Modificados

```
✓ components/layout/sidebar.tsx
✓ middleware.ts
✓ app/api/workshops/route.ts
✓ app/api/workshops/[id]/route.ts
```

## Verificación

### Rol Taller puede:
- ✅ Ver dashboard
- ✅ Ver sus vehículos asignados
- ✅ Gestionar mantenimientos
- ✅ Usar catálogo de repuestos
- ✅ Ver ubicaciones

### Rol Taller NO puede:
- ❌ Ver/editar clientes
- ❌ Ver gastos generales
- ❌ Ver reportes
- ❌ Ver documentos
- ❌ Ver notificaciones
- ❌ Ver comisiones

### Sistema de Talleres:
- ✅ Al crear mantenimiento aparecen talleres reales (BusinessLocations tipo "workshop")
- ✅ Los talleres muestran el usuario asociado
- ✅ Solo talleres activos se listan
- ✅ Compatible con el sistema de ubicaciones de negocio

## Beneficios

1. **Seguridad mejorada**: Los talleres solo ven lo que necesitan para su trabajo
2. **Datos consistentes**: Los talleres usan el mismo sistema de ubicaciones que el resto de la aplicación
3. **Flujo de trabajo optimizado**: Central asigna trabajo → Taller ejecuta y registra
4. **Mejor control**: Admin puede ver qué taller tiene qué mantenimiento
5. **Sin confusión**: Ya no aparecen talleres demo obsoletos

## Notas Importantes

- Los permisos se aplican tanto a nivel de UI (menú) como a nivel de API (middleware)
- Si un usuario taller intenta acceder directamente a una URL restringida, será redirigido a `/unauthorized`
- Los talleres existentes en `car_rental_workshops` NO se migran automáticamente
- Los nuevos talleres se crean como `BusinessLocations` con `type = 'workshop'`
- Para asociar un taller con un usuario, usar el campo `user_id` en BusinessLocations

## Próximos Pasos Recomendados

1. ✅ Verificar que existan ubicaciones tipo "workshop" en BusinessLocations
2. ✅ Asociar usuarios con rol "taller" a sus ubicaciones correspondientes
3. ✅ Probar el flujo completo: Central → Crear mantenimiento → Asignar taller → Taller gestiona
4. 📋 Considerar migrar talleres antiguos de `car_rental_workshops` si es necesario
5. 📋 Documentar para usuarios finales el nuevo flujo de trabajo

