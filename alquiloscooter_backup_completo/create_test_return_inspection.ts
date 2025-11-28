import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestReturnInspection() {
  try {
    console.log('🔍 Buscando inspección de entrega para copiar...\n');
    
    const deliveryInspection = await prisma.vehicleInspections.findFirst({
      where: {
        booking_id: 24,
        inspection_type: 'delivery'
      }
    });
    
    if (!deliveryInspection) {
      console.error('❌ No se encontró inspección de entrega');
      return;
    }
    
    console.log('✅ Inspección de entrega encontrada (ID:', deliveryInspection.id, ')');
    
    // Crear inspección de devolución basada en la de entrega
    const returnInspection = await prisma.vehicleInspections.create({
      data: {
        booking_id: deliveryInspection.booking_id,
        vehicle_id: deliveryInspection.vehicle_id,
        inspection_type: 'return',
        odometer_reading: (deliveryInspection.odometer_reading || 0) + 150, // +150 km
        fuel_level: deliveryInspection.fuel_level,
        front_photo: deliveryInspection.front_photo,
        left_photo: deliveryInspection.left_photo,
        rear_photo: deliveryInspection.rear_photo,
        right_photo: deliveryInspection.right_photo,
        odometer_photo: deliveryInspection.odometer_photo,
        general_condition: 'Vehículo en buen estado general después del uso',
        notes: 'Inspección de devolución de prueba generada automáticamente',
        inspection_date: new Date(),
        inspector_id: deliveryInspection.inspector_id
      }
    });
    
    console.log('✅ Inspección de devolución creada (ID:', returnInspection.id, ')');
    console.log('\n💡 Ahora puedes ejecutar el script de generación de contrato nuevamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestReturnInspection();
