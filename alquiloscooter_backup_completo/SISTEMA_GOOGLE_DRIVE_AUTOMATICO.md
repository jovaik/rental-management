# 📁 SISTEMA DE SINCRONIZACIÓN AUTOMÁTICA CON GOOGLE DRIVE

**Fecha de implementación:** 05/11/2025  
**Estado:** ✅ **FUNCIONANDO CORRECTAMENTE**

---

## 📋 DESCRIPCIÓN

Sistema de sincronización automática que crea carpetas en Google Drive para cada reserva y copia automáticamente todos los documentos del cliente (carnet de conducir y DNI).

---

## ✨ CARACTERÍSTICAS PRINCIPALES

### 1. **Sincronización Automática**
- Cuando se crea una nueva reserva, el sistema automáticamente:
  1. Crea una carpeta en Google Drive con el formato: `{NÚMERO_RESERVA} - {NOMBRE_CLIENTE} (Cliente #{ID})`
  2. Copia los 4 documentos del cliente a la carpeta:
     - `Carnet_Conducir_Frontal.jpg`
     - `Carnet_Conducir_Trasero.jpg`
     - `DNI_Frontal.jpg`
     - `DNI_Trasero.jpg`
  3. Guarda la URL de la carpeta en la base de datos

### 2. **Organización Inteligente**
- Todas las carpetas se crean dentro de una carpeta raíz llamada: **"Reservas AlquiloScooter"**
- Estructura clara y ordenada con número de reserva y nombre del cliente
- Fácil acceso y búsqueda de documentos

### 3. **Sin Intervención Manual**
- Todo el proceso es completamente automático
- No requiere ninguna acción por parte del usuario
- Los documentos se sincronizan en tiempo real

---

## 🔧 FUNCIONAMIENTO TÉCNICO

### Archivo Principal
```
/home/ubuntu/rental_management_app/app/lib/google-drive.ts
```

### Funciones Implementadas

#### 1. `createBookingFolder(bookingNumber, customerName, customerId)`
Crea la carpeta principal de la reserva en Google Drive.

**Parámetros:**
- `bookingNumber`: Número de la reserva (ej: "202511050001")
- `customerName`: Nombre completo del cliente
- `customerId`: ID del cliente en la base de datos

**Retorna:**
```typescript
{
  success: boolean;
  folderId?: string;        // ID de la carpeta en Google Drive
  folderUrl?: string;       // URL directa a la carpeta
  error?: string;          // Mensaje de error si falla
}
```

#### 2. `copyCustomerDocumentsToBooking(bookingNumber, customerId)`
Copia todos los documentos del cliente desde S3 a Google Drive.

**Parámetros:**
- `bookingNumber`: Número de la reserva
- `customerId`: ID del cliente

**Retorna:**
```typescript
{
  success: boolean;
  uploadedCount?: number;   // Cantidad de documentos subidos
  error?: string;          // Mensaje de error si falla
}
```

#### 3. `uploadFileToBookingFolder(bookingNumber, fileName, fileBuffer, mimeType)`
Sube un archivo específico a la carpeta de una reserva.

**Uso:**
Ideal para subir contratos, inspecciones, o cualquier documento adicional.

---

## 🔄 INTEGRACIÓN CON EL SISTEMA

### En la Creación de Reservas
Archivo: `/app/api/bookings/route.ts`

```typescript
// Automáticamente ejecutado después de crear la reserva
try {
  const { createBookingFolder, copyCustomerDocumentsToBooking } = 
    await import('@/lib/google-drive');
  
  // 1. Crear carpeta
  const folderResult = await createBookingFolder(
    booking.booking_number,
    customerName,
    customerId
  );

  if (folderResult.success) {
    // 2. Guardar datos en la base de datos
    await prisma.carRentalBookings.update({
      where: { id: booking.id },
      data: {
        google_drive_folder_id: folderResult.folderId,
        google_drive_folder_url: folderResult.folderUrl
      }
    });

    // 3. Copiar documentos del cliente
    if (customerId) {
      await copyCustomerDocumentsToBooking(
        booking.booking_number,
        customerId
      );
    }
  }
} catch (error) {
  // El error no afecta la creación de la reserva
  console.error('Error en sincronización con Google Drive:', error);
}
```

---

## 📊 BASE DE DATOS

### Tabla: `CarRentalBookings`

**Campos nuevos:**
- `google_drive_folder_id` (String, nullable): ID de la carpeta en Google Drive
- `google_drive_folder_url` (String, nullable): URL directa a la carpeta

### Ejemplo de consulta:
```sql
SELECT 
  booking_number,
  customer_name,
  google_drive_folder_url
FROM "CarRentalBookings"
WHERE google_drive_folder_id IS NOT NULL;
```

---

## 🧪 PRUEBA DE FUNCIONAMIENTO

### Resultado de la Prueba (05/11/2025)

```
✅ PRUEBA COMPLETADA EXITOSAMENTE

📋 Resumen:
  • Reserva: 202511050002
  • Cliente: LEWIS ANDERSON MOORE (#60)
  • Carpeta ID: 1JlH-PrPnkyWViVJBka2Km0tfLV_TMLm_
  • Documentos: 4 archivos

🔗 URL: https://drive.google.com/drive/folders/1JlH-PrPnkyWViVJBka2Km0tfLV_TMLm_
```

**Archivos subidos correctamente:**
- ✅ Carnet_Conducir_Frontal.jpg
- ✅ Carnet_Conducir_Trasero.jpg
- ✅ DNI_Frontal.jpg
- ✅ DNI_Trasero.jpg

---

## 🔐 AUTENTICACIÓN

### Token de Google Drive
El sistema utiliza OAuth2 para autenticarse con Google Drive.

**Ubicación del token:**
```
/home/ubuntu/.config/abacusai_auth_secrets.json
```

**Estructura:**
```json
{
  "googledriveuser": {
    "secrets": {
      "access_token": {
        "value": "TOKEN_AQUI"
      }
    }
  }
}
```

### Renovación del Token
Los tokens de Google Drive expiran después de 1 hora. El sistema maneja automáticamente la renovación mediante el servicio de autenticación de Abacus.AI.

---

## 🎯 CASOS DE USO

### 1. **Nueva Reserva**
✅ Al crear una reserva, automáticamente:
- Se crea la carpeta
- Se copian los documentos del cliente
- Se guarda la URL en la base de datos

### 2. **Contratos Generados**
🔄 **Pendiente de implementar:**
Cuando se genera un contrato, subirlo automáticamente a Google Drive.

### 3. **Inspecciones de Vehículos**
🔄 **Pendiente de implementar:**
Al completar una inspección (check-in/check-out), subir las fotos a Google Drive.

### 4. **Documentos Adicionales**
🔄 **Pendiente de implementar:**
Cualquier documento adicional relacionado con la reserva puede ser subido a la carpeta.

---

## 📌 VENTAJAS DEL SISTEMA

### ✅ Automatización Total
- No requiere intervención manual
- Ahorro de tiempo significativo
- Reducción de errores humanos

### ✅ Organización
- Todos los documentos en un solo lugar
- Fácil acceso desde cualquier dispositivo
- Historial completo de cada reserva

### ✅ Respaldo en la Nube
- Documentos seguros en Google Drive
- Redundancia: AWS S3 + Google Drive
- Protección contra pérdida de datos

### ✅ Accesibilidad
- Acceso desde cualquier dispositivo con Internet
- Compartir carpetas fácilmente con terceros
- No depende del sistema local

---

## 🚀 PRÓXIMAS MEJORAS SUGERIDAS

### 1. **Sincronización de Contratos**
```typescript
// Cuando se genera un contrato PDF
await uploadFileToBookingFolder(
  bookingNumber,
  'Contrato.pdf',
  contractBuffer,
  'application/pdf'
);
```

### 2. **Fotos de Inspección**
```typescript
// Al hacer check-in o check-out
await uploadFileToBookingFolder(
  bookingNumber,
  'Inspeccion_CheckIn.pdf',
  inspectionBuffer,
  'application/pdf'
);
```

### 3. **Sincronización Bidireccional**
- Detectar cambios en Google Drive
- Actualizar la base de datos local
- Webhook para cambios en tiempo real

### 4. **Notificaciones**
- Enviar email al cliente con enlace a la carpeta
- Notificar al staff cuando se suben nuevos documentos

---

## 🛠️ MANTENIMIENTO

### Verificar Estado del Sistema
```bash
cd /home/ubuntu/rental_management_app/app
yarn tsx test_google_drive_existing.ts
```

### Logs de Sincronización
Los logs se muestran en la consola del servidor:
```
✅ [Google Drive] Carpeta creada: {URL}
📄 [Google Drive] Copiando documentos del cliente #{ID}...
✅ [Google Drive] 4 documentos copiados
```

### En Caso de Error
Si la sincronización falla:
1. La reserva se crea igualmente (no es un error crítico)
2. Se registra el error en los logs
3. Se puede reintentar manualmente ejecutando el script de prueba

---

## 📞 SOPORTE

Para cualquier problema con la sincronización de Google Drive:

1. Verificar que el token esté actualizado
2. Revisar los logs del servidor
3. Ejecutar el script de prueba para diagnosticar el problema
4. Verificar permisos en Google Drive

---

## 📝 NOTAS FINALES

- ✅ Sistema probado y funcionando correctamente
- ✅ Compatible con todas las reservas existentes y futuras
- ✅ No afecta el funcionamiento del sistema si falla
- ✅ Fácil de mantener y extender

**El sistema está listo para producción y funcionará automáticamente con cada nueva reserva.**

---

**Última actualización:** 05/11/2025  
**Desarrollado por:** DeepAgent  
**Estado:** ✅ **PRODUCCIÓN**
