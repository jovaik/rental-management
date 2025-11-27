import { z } from 'zod';
import { ItemType, ItemStatus } from '@prisma/client';

// Validación para campos específicos de vehículos
export const vehicleAttributesSchema = z.object({
  registration: z.string().min(1, 'Matrícula requerida'),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
  mileage: z.number().min(0).optional(),
  fuelType: z.enum(['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID']).optional(),
  transmission: z.enum(['MANUAL', 'AUTOMATIC']).optional(),
  color: z.string().optional(),
  vin: z.string().optional(),
});

// Schema base para items
export const itemBaseSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  description: z.string().optional(),
  type: z.nativeEnum(ItemType),
  basePrice: z.number().min(0, 'Precio debe ser mayor que 0'),
  status: z.nativeEnum(ItemStatus).default('AVAILABLE'),
  photos: z.array(z.string()).optional(),
});

// Schema para crear item
export const createItemSchema = itemBaseSchema.extend({
  attributes: z.record(z.any()).optional(),
});

// Schema para actualizar item
export const updateItemSchema = createItemSchema.partial();

// Schema específico para crear vehículo
export const createVehicleSchema = itemBaseSchema.extend({
  type: z.literal(ItemType.VEHICLE),
  attributes: vehicleAttributesSchema,
});

// Validación de tipo en tiempo de ejecución
export function validateItemAttributes(type: ItemType, attributes: any) {
  if (type === ItemType.VEHICLE) {
    return vehicleAttributesSchema.safeParse(attributes);
  }
  // Para otros tipos, por ahora aceptamos cualquier objeto
  return { success: true, data: attributes };
}

// Tipos derivados
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type VehicleAttributes = z.infer<typeof vehicleAttributesSchema>;
