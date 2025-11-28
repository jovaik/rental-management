
/**
 * 🛴 GSCONTROL CONNECTOR - FACTURAS, TICKETS Y GASTOS
 * ⚠️  ACTUALIZACIÓN: Soporte para documentType, invoiceNumber, clientName, clientDni, costCategory
 * 
 * URL Base: https://gscontrol.abacusai.app
 * API Key: gs_69c6c837fac5c6ac12f40efcc44b55e9d2c97d61d3143933aa7390d14683d944
 */

// Configuración fija según instrucciones
const GSCONTROL_API_KEY = 'gs_69c6c837fac5c6ac12f40efcc44b55e9d2c97d61d3143933aa7390d14683d944';
const GSCONTROL_BASE_URL = 'https://gscontrol.abacusai.app';

/**
 * Mapeo de categorías de gasto a categorías GSControl
 */
const EXPENSE_CATEGORY_MAP: Record<string, string> = {
  'Mantenimiento': 'TALLERES',
  'Combustible': 'COMBUSTIBLE',
  'Seguros': 'SEGUROS',
  'Impuestos': 'GESTORIA',
  'Repuestos': 'REPUESTOS',
  'Otros': 'OTROS GASTOS',
  // Fallback
  'default': 'OTROS GASTOS'
};

/**
 * 🆕 MAPEO DE MÉTODO DE PAGO A TIPO DE DOCUMENTO
 * Regla de negocio GSControl:
 * - EFECTIVO / TPV_SUMUP → TICKET (no va al IVA)
 * - TRANSFERENCIA / TPV_NACIONAL (Unicaja) → FACTURA (sí va al IVA)
 * 
 * NOTA IMPORTANTE: "TARJETA" NO ES UN MÉTODO DE PAGO SEPARADO.
 * El cobro con tarjeta física se registra como TPV_NACIONAL (actualmente Unicaja).
 */
function getDocumentTypeFromPaymentMethod(paymentMethod: string | undefined): 'FACTURA' | 'TICKET' | undefined {
  if (!paymentMethod) return undefined;
  
  const method = paymentMethod.toUpperCase();
  
  // TICKET: efectivo o TPV SumUp
  if (method === 'EFECTIVO' || method === 'TPV_SUMUP' || method === 'SUMUP') {
    return 'TICKET';
  }
  
  // FACTURA: transferencia o TPV nacional (Unicaja = cobro con tarjeta)
  if (method === 'TRANSFERENCIA' || method === 'TPV_NACIONAL' || method === 'TPV' || method === 'BIZUM') {
    return 'FACTURA';
  }
  
  // Por defecto, si no reconocemos el método, devolver FACTURA (más seguro para IVA)
  return 'FACTURA';
}

/**
 * TAREA 1.1: NOTIFICAR CREACIÓN DE TRANSACCIÓN
 * Endpoint: POST /api/integrations/ingest
 */
async function notificarCreacionGSControl(transaccion: any) {
  try {
    // Construir el payload base
    const payload: any = {
      externalId: transaccion.id.toString(), // ID único en AlquiloScooter
      type: transaccion.esIngreso ? "INGRESO" : "GASTO", // Solo "INGRESO" o "GASTO"
      date: transaccion.fecha, // Formato: "YYYY-MM-DD" o "2025-10-31T10:30:00"
      amount: transaccion.importe, // Número con IVA incluido: 70, 85.50, etc
      description: transaccion.descripcion, // Texto descriptivo
      ivaRate: transaccion.ivaRate || 21 // Siempre 21 para España, pero permitir override
    };

    // Si es INGRESO, agregar campos de factura/ticket
    if (transaccion.esIngreso) {
      // documentType: "FACTURA" o "TICKET"
      if (transaccion.documentType) {
        payload.documentType = transaccion.documentType;
      }
      
      // Si es FACTURA, agregar número de factura
      if (transaccion.documentType === 'FACTURA' && transaccion.invoiceNumber) {
        payload.invoiceNumber = transaccion.invoiceNumber;
      }
      
      // Datos del cliente (opcional)
      if (transaccion.clientName) {
        payload.clientName = transaccion.clientName;
      }
      if (transaccion.clientDni) {
        payload.clientDni = transaccion.clientDni;
      }
    }

    // Si es GASTO, agregar categoría y tipo de documento
    if (!transaccion.esIngreso) {
      // Categoría del gasto
      if (transaccion.costCategory) {
        payload.costCategory = transaccion.costCategory;
      }
      
      // 🆕 Tipo de documento también para gastos
      if (transaccion.documentType) {
        payload.documentType = transaccion.documentType;
      }
      
      // Si es FACTURA, agregar número de factura
      if (transaccion.documentType === 'FACTURA' && transaccion.invoiceNumber) {
        payload.invoiceNumber = transaccion.invoiceNumber;
      }
    }

    const response = await fetch(`${GSCONTROL_BASE_URL}/api/integrations/ingest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GSCONTROL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('Error sincronizando con GS Control:', await response.text());
    } else {
      console.log('✔ Transacción sincronizada con GS Control');
    }
  } catch (error) {
    console.error('Error enviando a GS Control:', error);
  }
}

/**
 * TAREA 1.2: NOTIFICAR MODIFICACIÓN DE TRANSACCIÓN
 * Endpoint: PUT /api/integrations/ingest
 */
async function notificarModificacionGSControl(transaccion: any) {
  try {
    // Construir el payload base
    const payload: any = {
      externalId: transaccion.id.toString(),
      type: transaccion.esIngreso ? "INGRESO" : "GASTO",
      date: transaccion.fecha,
      amount: transaccion.importe,
      description: transaccion.descripcion,
      ivaRate: transaccion.ivaRate || 21
    };

    // Si es INGRESO, agregar campos de factura/ticket
    if (transaccion.esIngreso) {
      if (transaccion.documentType) {
        payload.documentType = transaccion.documentType;
      }
      if (transaccion.documentType === 'FACTURA' && transaccion.invoiceNumber) {
        payload.invoiceNumber = transaccion.invoiceNumber;
      }
      if (transaccion.clientName) {
        payload.clientName = transaccion.clientName;
      }
      if (transaccion.clientDni) {
        payload.clientDni = transaccion.clientDni;
      }
    }

    // Si es GASTO, agregar categoría y tipo de documento
    if (!transaccion.esIngreso) {
      // Categoría del gasto
      if (transaccion.costCategory) {
        payload.costCategory = transaccion.costCategory;
      }
      
      // 🆕 Tipo de documento también para gastos
      if (transaccion.documentType) {
        payload.documentType = transaccion.documentType;
      }
      
      // Si es FACTURA, agregar número de factura
      if (transaccion.documentType === 'FACTURA' && transaccion.invoiceNumber) {
        payload.invoiceNumber = transaccion.invoiceNumber;
      }
    }

    const response = await fetch(`${GSCONTROL_BASE_URL}/api/integrations/ingest`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GSCONTROL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('Error sincronizando modificación con GS Control:', await response.text());
    } else {
      console.log('✅ Modificación sincronizada con GS Control');
    }
  } catch (error) {
    console.error('Error enviando modificación a GS Control:', error);
  }
}

/**
 * TAREA 1.3: NOTIFICAR ELIMINACIÓN DE TRANSACCIÓN
 * Endpoint: DELETE /api/integrations/ingest
 */
async function notificarEliminacionGSControl(transaccionId: any) {
  try {
    const response = await fetch(`${GSCONTROL_BASE_URL}/api/integrations/ingest`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${GSCONTROL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        externalId: transaccionId.toString()
      })
    });

    if (!response.ok) {
      console.error('Error sincronizando eliminación con GS Control:', await response.text());
    } else {
      console.log('✔ Eliminación sincronizada con GS Control');
    }
  } catch (error) {
    console.error('Error enviando eliminación a GS Control:', error);
  }
}

// ========================================
// EXPORTS COMPATIBLES CON EL CÓDIGO EXISTENTE
// ========================================

/**
 * Verifica si GSControl está configurado
 */
export const isGSControlEnabled = (): boolean => {
  return GSCONTROL_API_KEY.length > 0 && GSCONTROL_API_KEY.startsWith('gs_');
};

/**
 * Adaptador para compatibilidad con código existente
 * Convierte el formato de AlquiloScooter al formato del PDF
 * ⚠️  ACTUALIZADO: Soporte para facturas, tickets y gastos categorizados
 */
export const syncToGSControl = (data: {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: Date;
  bookingId?: number;
  customerId?: number;
  customerName?: string;
  customerDni?: string;
  vehicleId?: number;
  supplierId?: number;
  category?: string;
  documentType?: 'FACTURA' | 'TICKET' | 'NO APLICA';
  invoiceNumber?: string;
  ivaRate?: number;
  paymentMethod?: string;
}): string | null => {
  try {
    const transaccion: any = {
      id: data.bookingId || Date.now(),
      esIngreso: data.type === 'income',
      importe: data.amount,
      descripcion: data.description,
      fecha: data.date.toISOString().split('T')[0], // YYYY-MM-DD
      ivaRate: data.ivaRate || 21
    };

    // ✅ NUEVO: Agregar campos de factura/ticket para INGRESOS
    if (data.type === 'income') {
      // 🆕 PRIORIDAD 1: Determinar tipo de documento según método de pago
      const documentTypeFromPayment = getDocumentTypeFromPaymentMethod(data.paymentMethod);
      
      // Usar el documentType derivado del método de pago, o el proporcionado como fallback
      const finalDocumentType = documentTypeFromPayment || data.documentType;
      
      if (finalDocumentType === 'FACTURA') {
        transaccion.documentType = 'FACTURA';
        transaccion.invoiceNumber = data.invoiceNumber || '';
      } else if (finalDocumentType === 'TICKET') {
        transaccion.documentType = 'TICKET';
      }
      // NO APLICA o undefined → no enviar documentType

      // Datos del cliente (opcional)
      if (data.customerName) {
        transaccion.clientName = data.customerName;
      }
      if (data.customerDni) {
        transaccion.clientDni = data.customerDni;
      }
    }

    // ✅ NUEVO: Agregar categoría y tipo de documento para GASTOS
    if (data.type === 'expense') {
      // Categoría del gasto
      if (data.category) {
        transaccion.costCategory = EXPENSE_CATEGORY_MAP[data.category] || EXPENSE_CATEGORY_MAP['default'];
      }
      
      // 🆕 PRIORIDAD 1: Determinar tipo de documento según método de pago
      const documentTypeFromPayment = getDocumentTypeFromPaymentMethod(data.paymentMethod);
      
      // Usar el documentType derivado del método de pago, o el proporcionado como fallback
      const finalDocumentType = documentTypeFromPayment || data.documentType;
      
      if (finalDocumentType === 'FACTURA') {
        transaccion.documentType = 'FACTURA';
        transaccion.invoiceNumber = data.invoiceNumber || '';
      } else if (finalDocumentType === 'TICKET') {
        transaccion.documentType = 'TICKET';
      }
    }

    // Llamar función del PDF (sin await para fire-and-forget)
    notificarCreacionGSControl(transaccion);

    return transaccion.id.toString();
  } catch (error: any) {
    console.error('❌ Error en syncToGSControl:', error.message);
    return null;
  }
};

/**
 * Adaptador para actualización
 * ⚠️  ACTUALIZADO: Soporte para facturas, tickets y gastos categorizados
 */
export const updateGSControlTransaction = (
  externalId: string,
  data: {
    type?: 'income' | 'expense';
    amount?: number;
    description?: string;
    date?: Date;
    ivaRate?: number;
    documentType?: 'FACTURA' | 'TICKET' | 'NO APLICA';
    invoiceNumber?: string;
    customerName?: string;
    customerDni?: string;
    category?: string;
    paymentMethod?: string;
  }
): boolean => {
  try {
    const transaccion: any = {
      id: externalId,
      esIngreso: data.type ? data.type === 'income' : true, // Default a ingreso
      importe: data.amount || 0,
      descripcion: data.description || '',
      fecha: data.date ? data.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      ivaRate: data.ivaRate || 21
    };

    // ✅ NUEVO: Agregar campos de factura/ticket para INGRESOS
    if (transaccion.esIngreso) {
      // 🆕 PRIORIDAD 1: Determinar tipo de documento según método de pago
      const documentTypeFromPayment = getDocumentTypeFromPaymentMethod(data.paymentMethod);
      
      // Usar el documentType derivado del método de pago, o el proporcionado como fallback
      const finalDocumentType = documentTypeFromPayment || data.documentType;
      
      if (finalDocumentType === 'FACTURA') {
        transaccion.documentType = 'FACTURA';
        transaccion.invoiceNumber = data.invoiceNumber || '';
      } else if (finalDocumentType === 'TICKET') {
        transaccion.documentType = 'TICKET';
      }

      if (data.customerName) {
        transaccion.clientName = data.customerName;
      }
      if (data.customerDni) {
        transaccion.clientDni = data.customerDni;
      }
    }

    // ✅ NUEVO: Agregar categoría y tipo de documento para GASTOS
    if (!transaccion.esIngreso) {
      // Categoría del gasto
      if (data.category) {
        transaccion.costCategory = EXPENSE_CATEGORY_MAP[data.category] || EXPENSE_CATEGORY_MAP['default'];
      }
      
      // 🆕 PRIORIDAD 1: Determinar tipo de documento según método de pago
      const documentTypeFromPayment = getDocumentTypeFromPaymentMethod(data.paymentMethod);
      
      // Usar el documentType derivado del método de pago, o el proporcionado como fallback
      const finalDocumentType = documentTypeFromPayment || data.documentType;
      
      if (finalDocumentType === 'FACTURA') {
        transaccion.documentType = 'FACTURA';
        transaccion.invoiceNumber = data.invoiceNumber || '';
      } else if (finalDocumentType === 'TICKET') {
        transaccion.documentType = 'TICKET';
      }
    }

    // Llamar función del PDF (sin await para fire-and-forget)
    notificarModificacionGSControl(transaccion);

    return true;
  } catch (error: any) {
    console.error('❌ Error en updateGSControlTransaction:', error.message);
    return false;
  }
};

/**
 * Adaptador para eliminación
 */
export const deleteGSControlTransaction = (
  externalId: string | string[]
): boolean => {
  try {
    const externalIds = Array.isArray(externalId) ? externalId : [externalId];

    // Llamar función del PDF para cada ID
    externalIds.forEach(id => {
      notificarEliminacionGSControl(id);
    });

    return true;
  } catch (error: any) {
    console.error('❌ Error en deleteGSControlTransaction:', error.message);
    return false;
  }
};

/**
 * Función legacy para compatibilidad
 */
export const deleteGSControlTransactionsBatch = (
  externalIds: string[]
): boolean => {
  return deleteGSControlTransaction(externalIds);
};

/**
 * Función legacy para compatibilidad
 */
export const syncBookingIncome = async (bookingId: number, totalAmount: number): Promise<string | null> => {
  console.warn('⚠️  syncBookingIncome está deprecated. Usar syncToGSControl directamente.');
  return null;
};
