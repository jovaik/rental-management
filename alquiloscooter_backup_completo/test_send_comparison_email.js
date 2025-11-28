
/**
 * Script de prueba para enviar email con PDF comparativo
 * Envía email a info@alquiloscooter.com con la reserva 202511100001
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '/home/ubuntu/rental_management_app/app/.env' });

const prisma = new PrismaClient();

async function testComparisonEmail() {
  try {
    console.log('🧪 Iniciando test de email comparativo...\n');

    // Buscar la inspección de devolución de la reserva 202511100001
    const returnInspection = await prisma.vehicleInspections.findFirst({
      where: {
        booking: {
          booking_number: '202511100001'
        },
        inspection_type: 'return'
      },
      include: {
        booking: {
          include: {
            customer: true
          }
        },
        vehicle: true
      }
    });

    if (!returnInspection) {
      console.error('❌ No se encontró inspección de devolución para 202511100001');
      return;
    }

    console.log('✅ Inspección encontrada:');
    console.log('   ID:', returnInspection.id);
    console.log('   Tipo:', returnInspection.inspection_type);
    console.log('   Reserva:', returnInspection.booking.booking_number);
    console.log('   Vehículo:', returnInspection.vehicle?.make, returnInspection.vehicle?.model);
    console.log('   Cliente original:', returnInspection.booking.customer?.email);
    console.log('\n📧 Enviando a: info@alquiloscooter.com\n');

    // Importar la función de envío
    const { sendInspectionNotification } = require('./lib/inspection-email-notifier');

    // Enviar email con PDF comparativo
    const result = await sendInspectionNotification({
      inspectionId: returnInspection.id,
      bookingNumber: returnInspection.booking.booking_number,
      customerEmail: 'info@alquiloscooter.com', // ✅ Email de prueba
      customerName: 'Equipo Alquiloscooter (PRUEBA)',
      vehicleInfo: `${returnInspection.vehicle?.make} ${returnInspection.vehicle?.model} (${returnInspection.vehicle?.registration_number})`,
      inspectionType: returnInspection.inspection_type,
      inspectionDate: returnInspection.inspection_date,
      pickupDate: returnInspection.booking.pickup_date,
      returnDate: returnInspection.booking.return_date
    });

    if (result.success) {
      console.log('\n✅ ¡EMAIL ENVIADO EXITOSAMENTE!');
      console.log('   Destinatario: info@alquiloscooter.com');
      console.log('   Adjunto: PDF comparativo (entrega + devolución)');
      console.log('\n📬 Por favor revisa la bandeja de entrada de info@alquiloscooter.com');
    } else {
      console.error('\n❌ Error enviando email:', result.error);
    }
  } catch (error) {
    console.error('\n❌ Error en test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testComparisonEmail();
