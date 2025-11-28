const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSync() {
  console.log('🔍 Verificando última reserva creada...\n');
  
  // Obtener la última reserva (ID más alto)
  const ultimaReserva = await prisma.carRentalBookings.findFirst({
    orderBy: { id: 'desc' },
    include: {
      car: true,
      customer: true
    }
  });
  
  if (!ultimaReserva) {
    console.log('❌ No hay reservas en la base de datos');
    return;
  }
  
  console.log('📋 ÚLTIMA RESERVA:');
  console.log('   ID:', ultimaReserva.id);
  console.log('   Número:', ultimaReserva.booking_number);
  console.log('   Estado:', ultimaReserva.status);
  console.log('   Cliente:', ultimaReserva.customer_name);
  console.log('   Vehículo:', ultimaReserva.car?.registration_number);
  console.log('   Total:', ultimaReserva.total_price, '€');
  console.log('   gscontrol_external_id:', ultimaReserva.gscontrol_external_id || '(NO SINCRONIZADO)');
  
  // Verificar si tiene external_id
  if (ultimaReserva.gscontrol_external_id) {
    console.log('\n✅ Esta reserva YA ESTÁ SINCRONIZADA con GSControl');
  } else {
    console.log('\n❌ Esta reserva NO está sincronizada con GSControl');
    console.log('   Razón posible:');
    console.log('   - Monto es 0: ' + (ultimaReserva.total_price == 0 ? 'SÍ' : 'NO'));
    console.log('   - Estado es confirmed: ' + (ultimaReserva.status === 'confirmed' ? 'SÍ' : 'NO'));
  }
}

testSync()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
