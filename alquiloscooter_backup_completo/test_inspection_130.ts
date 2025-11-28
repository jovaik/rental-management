
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('🔍 Verificando inspección 49 (devolución de reserva 130)...\n');
    
    const inspection = await prisma.vehicleInspections.findUnique({
      where: { id: 49 },
      include: {
        booking: {
          include: {
            customer: true,
            vehicles: { include: { car: true } }
          }
        },
        vehicle: true
      }
    });
    
    if (!inspection) {
      console.log('❌ Inspección 49 NO ENCONTRADA');
      process.exit(1);
    }
    
    console.log('✅ Inspección encontrada:');
    console.log('  - ID:', inspection.id);
    console.log('  - Tipo:', inspection.inspection_type);
    console.log('  - Booking ID:', inspection.booking_id);
    console.log('  - Booking Number:', inspection.booking?.booking_number);
    console.log('  - Cliente Email:', inspection.booking?.customer?.email);
    console.log('  - Vehículo:', inspection.vehicle ? `${inspection.vehicle.make} ${inspection.vehicle.model}` : 'N/A');
    console.log('\n📸 Fotos de devolución:');
    console.log('  - front_photo:', inspection.front_photo ? '✅' : '❌');
    console.log('  - left_photo:', inspection.left_photo ? '✅' : '❌');
    console.log('  - rear_photo:', inspection.rear_photo ? '✅' : '❌');
    console.log('  - right_photo:', inspection.right_photo ? '✅' : '❌');
    console.log('  - odometer_photo:', inspection.odometer_photo ? '✅' : '❌');
    
    // Verificar inspección de entrega
    console.log('\n🔍 Buscando inspección de entrega...');
    const deliveryInspection = await prisma.vehicleInspections.findFirst({
      where: {
        booking_id: inspection.booking_id,
        inspection_type: { in: ['delivery', 'DELIVERY', 'CHECKIN'] }
      }
    });
    
    if (deliveryInspection) {
      console.log('✅ Inspección de entrega encontrada:');
      console.log('  - ID:', deliveryInspection.id);
      console.log('  - Tipo:', deliveryInspection.inspection_type);
      console.log('\n📸 Fotos de entrega:');
      console.log('  - front_photo:', deliveryInspection.front_photo ? '✅' : '❌');
      console.log('  - left_photo:', deliveryInspection.left_photo ? '✅' : '❌');
      console.log('  - rear_photo:', deliveryInspection.rear_photo ? '✅' : '❌');
      console.log('  - right_photo:', deliveryInspection.right_photo ? '✅' : '❌');
      console.log('  - odometer_photo:', deliveryInspection.odometer_photo ? '✅' : '❌');
    } else {
      console.log('❌ NO HAY INSPECCIÓN DE ENTREGA - Esto causará error en PDF comparativo');
    }
    
    // Verificar configuración SMTP
    console.log('\n📧 Configuración SMTP:');
    console.log('  - SMTP_HOST:', process.env.SMTP_HOST || '❌ NO CONFIGURADO');
    console.log('  - SMTP_PORT:', process.env.SMTP_PORT || '❌ NO CONFIGURADO');
    console.log('  - SMTP_USER:', process.env.SMTP_USER || '❌ NO CONFIGURADO');
    console.log('  - SMTP_FROM:', process.env.SMTP_FROM || '❌ NO CONFIGURADO');
    console.log('  - ADMIN_EMAIL:', process.env.ADMIN_EMAIL || '❌ NO CONFIGURADO');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error instanceof Error ? error.message : error);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
