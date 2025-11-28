require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { syncToGSControl } = require('./lib/gscontrol-connector');
const prisma = new PrismaClient();

async function testManualSync() {
  console.log('🔄 Intentando sincronizar reserva #112 manualmente...\n');
  
  const booking = await prisma.carRentalBookings.findUnique({
    where: { id: 112 },
    include: {
      car: true,
      customer: true
    }
  });
  
  if (!booking) {
    console.log('❌ Reserva no encontrada');
    return;
  }
  
  console.log('📋 Datos de la reserva:');
  console.log('   ID:', booking.id);
  console.log('   Número:', booking.booking_number);
  console.log('   Total:', booking.total_price);
  console.log('   Cliente:', booking.customer_name);
  console.log('   DNI:', booking.customer?.dni_nie || 'Sin DNI');
  console.log('   Vehículo:', booking.car?.registration_number);
  console.log('   Fecha:', booking.pickup_date);
  console.log('\n🚀 Llamando a syncToGSControl...\n');
  
  try {
    const gsExternalId = await syncToGSControl({
      type: 'income',
      amount: parseFloat(String(booking.total_price || 0)),
      description: `Reserva #${booking.booking_number} - ${booking.customer_name} - ${booking.car?.registration_number}`,
      date: booking.pickup_date,
      bookingId: booking.id,
      customerId: booking.customer_id || undefined,
      customerName: booking.customer_name,
      customerDni: booking.customer?.dni_nie || undefined,
      vehicleId: booking.car_id || undefined,
      documentType: 'NO APLICA',
      ivaRate: 21,
    });
    
    console.log('\n✅ RESULTADO:', gsExternalId);
    
    if (gsExternalId) {
      console.log('\n🎉 ¡Sincronización exitosa! ExternalId:', gsExternalId);
    } else {
      console.log('\n❌ syncToGSControl devolvió null/undefined');
    }
  } catch (error) {
    console.error('\n❌ ERROR durante la sincronización:');
    console.error(error);
  }
}

testManualSync()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
