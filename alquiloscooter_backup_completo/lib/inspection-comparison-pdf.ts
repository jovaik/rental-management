
/**
 * Generador de PDF comparativo de inspecciones
 * Genera un PDF que muestra lado a lado las inspecciones de entrega y devolución
 * Utiliza URLs firmadas con 7 días de caducidad para las fotos
 */

import { prisma } from './db';
import { generateInspectionPDF } from './inspections/inspection-pdf';

/**
 * Genera un PDF comparativo a partir del ID de inspección de devolución
 * Busca automáticamente la inspección de entrega correspondiente
 */
export async function generateComparisonPDFBuffer(returnInspectionId: number): Promise<Buffer> {
  try {
    console.log(`📊 [PDF Comparativo] Iniciando generación para inspección ${returnInspectionId}...`);
    
    // Obtener inspección de devolución con datos relacionados
    const returnInspection = await prisma.vehicleInspections.findUnique({
      where: { id: returnInspectionId },
      include: {
        booking: true,
        vehicle: true,
        inspector: true
      }
    });

    if (!returnInspection) {
      throw new Error(`Inspección de devolución ${returnInspectionId} no encontrada`);
    }

    if (returnInspection.inspection_type !== 'return') {
      throw new Error(`La inspección ${returnInspectionId} no es de tipo devolución`);
    }

    console.log(`✅ Inspección de devolución encontrada: Reserva ${returnInspection.booking?.booking_number}`);

    // Buscar inspección de entrega correspondiente
    const deliveryInspection = await prisma.vehicleInspections.findFirst({
      where: {
        booking_id: returnInspection.booking_id,
        vehicle_id: returnInspection.vehicle_id,
        inspection_type: 'delivery'
      },
      include: {
        inspector: true
      }
    });

    if (!deliveryInspection) {
      console.warn(`⚠️  No se encontró inspección de entrega para la reserva ${returnInspection.booking_id}`);
      // Si no hay inspección de entrega, generar solo PDF de devolución
      throw new Error('No se encontró inspección de entrega correspondiente');
    }

    console.log(`✅ Inspección de entrega encontrada (ID ${deliveryInspection.id})`);

    // Obtener configuración de empresa
    const companyConfig = await prisma.companyConfig.findFirst({ where: { active: true } });
    const companyName = companyConfig?.company_name || 'Alquiloscooter';

    // Preparar datos para el PDF comparativo usando la función existente
    const pdfData = {
      bookingNumber: returnInspection.booking?.booking_number || '',
      vehicle: {
        registration_number: returnInspection.vehicle?.registration_number || '',
        make: returnInspection.vehicle?.make || '',
        model: returnInspection.vehicle?.model || ''
      },
      deliveryInspection: {
        id: deliveryInspection.id,
        inspection_type: 'delivery',
        inspection_date: deliveryInspection.inspection_date.toISOString(),
        odometer_reading: deliveryInspection.odometer_reading || 0,
        fuel_level: deliveryInspection.fuel_level || 'empty',
        front_photo: deliveryInspection.front_photo,
        left_photo: deliveryInspection.left_photo,
        rear_photo: deliveryInspection.rear_photo,
        right_photo: deliveryInspection.right_photo,
        odometer_photo: deliveryInspection.odometer_photo,
        general_condition: deliveryInspection.general_condition,
        notes: deliveryInspection.notes,
        inspector: {
          firstname: deliveryInspection.inspector?.firstname || '',
          lastname: deliveryInspection.inspector?.lastname || ''
        }
      },
      returnInspection: {
        id: returnInspection.id,
        inspection_type: 'return',
        inspection_date: returnInspection.inspection_date.toISOString(),
        odometer_reading: returnInspection.odometer_reading || 0,
        fuel_level: returnInspection.fuel_level || 'empty',
        front_photo: returnInspection.front_photo,
        left_photo: returnInspection.left_photo,
        rear_photo: returnInspection.rear_photo,
        right_photo: returnInspection.right_photo,
        odometer_photo: returnInspection.odometer_photo,
        general_condition: returnInspection.general_condition,
        notes: returnInspection.notes,
        inspector: {
          firstname: returnInspection.inspector?.firstname || '',
          lastname: returnInspection.inspector?.lastname || ''
        }
      },
      companyName
    };

    console.log(`📄 Generando PDF comparativo con ambas inspecciones...`);
    
    // Usar la función existente que ya genera el PDF comparativo
    const pdfBuffer = await generateInspectionPDF(pdfData);
    
    console.log(`✅ [PDF Comparativo] PDF generado exitosamente (${pdfBuffer.length} bytes)`);
    
    return pdfBuffer;
  } catch (error) {
    console.error('❌ [PDF Comparativo] Error:', error);
    throw error;
  }
}
