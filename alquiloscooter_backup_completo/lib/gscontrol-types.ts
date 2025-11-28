
/**
 * GSControl API Integration - TypeScript Types
 * Sistema de consolidación económica en tiempo real
 */

export type TransactionType = 'INGRESO' | 'GASTO';
export type DocumentType = 'FACTURA' | 'NO APLICA';

export interface GSControlTransaction {
  externalId: string;                    // ID único para evitar duplicados
  type: TransactionType;                  // INGRESO o GASTO (MAYÚSCULAS)
  date: string;                          // ISO 8601: "2025-10-30" o "2025-10-30T14:30:00Z"
  amount: number;                        // Monto BRUTO con IVA incluido
  description: string;                   // Descripción clara de la operación
  
  // Campos opcionales pero recomendados
  ivaRate?: number;                      // Porcentaje IVA (ej: 21)
  documentType?: DocumentType;           // "FACTURA" o "NO APLICA"
  
  // Solo si documentType = "FACTURA"
  invoiceNumber?: string;                // Número de factura
  clientName?: string;                   // Nombre del cliente
  clientDni?: string;                    // NIF/DNI del cliente
  
  // Solo para GASTOS
  costCategory?: string;                 // Categoría del gasto
  
  // Metadata adicional (opcional)
  metadata?: Record<string, any>;
}

export interface GSControlSyncRequest {
  transactions: GSControlTransaction[];
}

export interface GSControlSyncResponse {
  success: boolean;
  inserted?: number;
  duplicates?: number;
  errors?: number;
  message?: string;
  details?: any[];
}

export interface GSControlConfig {
  enabled: boolean;
  apiKey: string;
  endpoint: string;
}
