
import { sendInspectionNotification } from './lib/inspection-email-notifier';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    console.log('🔄 [TEST] Iniciando prueba de envío de email para inspección 49...\n');
    
    // Obtener datos de la inspección
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
    
    if (!inspection || !inspection.booking) {
      console.log('❌ No se encontró la inspección o la reserva');
      process.exit(1);
    }
    
    const booking = inspection.booking;
    const customer = booking.customer;
    const vehicle = inspection.vehicle || booking.vehicles[0]?.car;
    
    if (!customer || !vehicle) {
      console.log('❌ Datos incompletos');
      process.exit(1);
    }
    
    console.log('📋 Datos a enviar:');
    console.log('  - Inspección ID:', inspection.id);
    console.log('  - Tipo:', inspection.inspection_type);
    console.log('  - Cliente:', customer.email);
    console.log('  - Vehículo:', `${vehicle.make} ${vehicle.model} - ${vehicle.registration_number}`);
    console.log('\n🚀 Enviando email...\n');
    
    const result = await sendInspectionNotification({
      inspectionId: inspection.id,
      bookingNumber: booking.booking_number || `Reserva ${booking.id}`,
      customerEmail: customer.email || '',
      customerName: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
      vehicleInfo: `${vehicle.make} ${vehicle.model} - ${vehicle.registration_number}`,
      inspectionType: inspection.inspection_type || 'delivery',
      inspectionDate: inspection.inspection_date || new Date(),
      pickupDate: booking.pickup_date || undefined,
      returnDate: booking.return_date || undefined
    });
    
    if (result.success) {
      console.log('\n✅ ========== EMAIL ENVIADO EXITOSAMENTE ==========');
      console.log('✅ Revisa la bandeja de entrada de:', customer.email);
      console.log('✅ También revisa spam/correo no deseado');
    } else {
      console.log('\n❌ ========== ERROR ENVIANDO EMAIL ==========');
      console.log('❌ Error:', result.error);
    }
    
  } catch (error) {
    console.error('\n❌ ========== ERROR COMPLETO ==========');
    console.error(error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

test();
