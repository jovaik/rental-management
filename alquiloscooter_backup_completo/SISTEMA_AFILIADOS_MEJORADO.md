
# Sistema de Afiliados Mejorado - Completado

## 📋 Resumen

Se ha ampliado significativamente el sistema de afiliados para incluir todos los campos necesarios para una gestión profesional de colaboradores, hoteles, agencias y otros socios comerciales.

## 🗄️ Base de Datos

### Nueva Tabla: `affiliate_profiles`

Tabla completa con todos los datos del afiliado:

**Campos incluidos:**
- ✅ Información básica del negocio (nombre comercial, contactos principal y secundario)
- ✅ Emails múltiples (principal y secundario)
- ✅ Teléfonos múltiples (principal y secundario)
- ✅ Dirección completa (calle, ciudad, provincia, código postal, país)
- ✅ Datos fiscales (NIF/CIF, razón social)
- ✅ Dirección fiscal (si es diferente a la comercial)
- ✅ Categorización (tipo y categoría de afiliado)
- ✅ Sistema de comisiones (porcentaje personalizado)
- ✅ Métodos de pago (transferencia, PayPal, efectivo, etc.)
- ✅ Datos bancarios (IBAN, email PayPal)
- ✅ Personalización de widget (para futuro)
- ✅ Estado y notas internas

### Enums Creados

```typescript
enum AffiliateType {
  HOTEL           // Hotel, hostal, resort
  AGENCY          // Agencia de viajes
  RESTAURANT      // Restaurante, bar
  SHOP            // Tienda, comercio
  INDIVIDUAL      // Persona individual
  OTHER           // Otros
}

enum AffiliateCategory {
  PLATINUM        // Comisión máxima, personalización completa
  GOLD            // Comisión alta, personalizaciones
  SILVER          // Comisión media
  STANDARD        // Comisión base
}

enum AffiliateStatus {
  PENDING         // Pendiente de aprobación
  ACTIVE          // Activo
  INACTIVE        // Inactivo temporal
  SUSPENDED       // Suspendido
  REJECTED        // Rechazado
}

enum PaymentMethod {
  BANK_TRANSFER   // Transferencia bancaria
  PAYPAL          // PayPal
  CASH            // Efectivo
  CHECK           // Cheque
  OTHER           // Otro método
}
```

## 🔧 Backend (API)

### `POST /api/admin/affiliates`

Actualizado para crear perfil completo:

**Campos aceptados:**
```typescript
{
  // Básicos
  email: string
  businessName: string
  contactPersonPrimary: string
  contactPersonSecondary?: string
  phonePrimary: string
  phoneSecondary?: string
  emailSecondary?: string
  
  // Dirección
  addressStreet?: string
  addressCity?: string
  addressState?: string
  addressPostalCode?: string
  addressCountry?: string
  
  // Fiscal
  taxId?: string
  legalName?: string
  fiscalAddress*?: string  // Todos los campos fiscales
  
  // Categorización
  affiliateType?: AffiliateType
  affiliateCategory?: AffiliateCategory
  commissionPercentage?: number
  
  // Pago
  paymentMethod?: PaymentMethod
  bankAccount?: string
  paypalEmail?: string
  
  // Notas
  notes?: string
}
```

**Campos obligatorios:** `email`, `businessName`, `contactPersonPrimary`, `phonePrimary`

**Respuesta:**
```typescript
{
  success: true,
  user: {
    id: number
    email: string
    name: string
    businessName: string
    referralCode: string
    tempPassword: string  // Para enviar por email
  }
}
```

### `GET /api/admin/affiliates`

Actualizado para incluir perfil completo:

**Respuesta:**
```typescript
[
  {
    id: number
    email: string
    name: string
    role: string
    referralCode: string
    referralEnabled: boolean
    commissionPercentage: number
    totalBookings: number
    completedBookings: number
    totalRevenue: number
    conversionRate: number
    profile?: {
      businessName: string
      contactPrimary: string
      contactSecondary?: string
      phonePrimary: string
      phoneSecondary?: string
      emailSecondary?: string
      address: { ... }
      fiscal: { ... }
      type: AffiliateType
      category: AffiliateCategory
      status: AffiliateStatus
      paymentMethod?: PaymentMethod
      bankAccount?: string
      paypalEmail?: string
      notes?: string
    }
  }
]
```

## 🎨 Frontend (Pendiente)

Se ha creado el esquema del formulario con tabs organizados:

1. **Tab Básico:**
   - Emails (principal y secundario)
   - Nombre comercial/empresa
   - Contactos (principal y secundario)
   - Teléfonos (principal y secundario)
   - Tipo de afiliado
   - Categoría

2. **Tab Dirección:**
   - Calle y número
   - Ciudad
   - Provincia/Estado
   - Código postal
   - País

3. **Tab Fiscal:**
   - NIF/CIF
   - Razón social
   - Dirección fiscal completa (si es diferente)

4. **Tab Pago:**
   - Porcentaje de comisión
   - Método de pago preferido
   - IBAN
   - Email PayPal
   - Notas internas

## 💡 Casos de Uso

### Hotel con múltiples contactos

```
Nombre Comercial: Hotel Marbella Beach
Contacto Principal: Juan García (Gerente)
Contacto Secundario: María López (Recepción)
Teléfono Principal: +34 600 123 456
Teléfono Secundario: +34 600 123 457
Email Principal: gerencia@hotelmarbella.com
Email Secundario: recepcion@hotelmarbella.com
Tipo: HOTEL
Categoría: GOLD (15% comisión)
```

### Agencia de viajes

```
Nombre Comercial: Viajes Sol y Playa S.L.
Razón Social: Viajes Sol y Playa Sociedad Limitada
NIF: B12345678
Contacto Principal: Pedro Martínez
Tipo: AGENCY
Categoría: PLATINUM (20% comisión)
Método de Pago: BANK_TRANSFER
IBAN: ES12 1234 1234 1234 1234 1234
```

### Persona individual

```
Nombre Comercial: Juan García
Contacto Principal: Juan García
Teléfono: +34 600 123 456
Email: juan@gmail.com
Tipo: INDIVIDUAL
Categoría: STANDARD (10% comisión)
Método de Pago: PAYPAL
PayPal Email: juan@paypal.com
```

## 🔮 Funcionalidades Futuras

### Personalización del Widget

Los campos ya están en la base de datos para permitir:

- `widget_custom_name`: Nombre personalizado en el widget
- `widget_show_branding`: Mostrar "by Alquiloscooter" o no
- `widget_custom_color`: Color corporativo del afiliado
- `widget_custom_logo_url`: Logo del afiliado

Ejemplo: Hotel podría tener widget con su logo y colores, mostrando "powered by Alquiloscooter".

## ✅ Estado Actual

- ✅ Base de datos creada con todos los campos
- ✅ API backend completamente actualizada
- ✅ Validaciones implementadas
- ⏳ Formulario frontend (preparado, falta integrar)
- ⏳ Vista de detalle de afiliado
- ⏳ Edición de afiliados existentes

## 📝 Próximos Pasos

1. Actualizar la página `/admin/affiliates` para usar el nuevo formulario
2. Crear vista de detalle completo del afiliado
3. Permitir edición de perfiles existentes
4. Implementar sistema de aprobación (cambio de PENDING → ACTIVE)
5. Dashboard de comisiones por afiliado
6. Sistema de pagos y liquidaciones

## 🎯 Listo para Pruebas

El sistema backend está completamente funcional y listo para empezar a capturar afiliados con todos los datos necesarios.

Para probarlo mañana, usar la API directamente o actualizar el frontend con el formulario preparado.
