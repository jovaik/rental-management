require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('\n=== VERIFICACIÓN EMAIL RESERVA 202511180001 ===\n');
  
  const booking = await prisma.carRentalBookings.findFirst({
    where: { booking_number: '202511180001' },
    include: {
      customer: true,
      vehicles: { include: { car: true } },
      contract: true
    }
  });
  
  if (!booking) {
    console.log('❌ Reserva no encontrada');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`📋 RESERVA ${booking.id}:`);
  console.log(`   Número: ${booking.booking_number}`);
  console.log(`   Cliente: ${booking.customer?.email || 'Sin email'}`);
  console.log(`   Estado: ${booking.status}`);
  console.log(`   Fecha creación: ${booking.created_at}`);
  console.log(`   Vehículos: ${booking.vehicles?.length || 0}`);
  
  // Verificar contrato
  const contract = booking.contract;
  console.log(`\n📄 CONTRATO:`);
  if (contract) {
    console.log(`   ID: ${contract.id}`);
    console.log(`   Firmado: ${contract.signed_at ? 'Sí' : 'No'}`);
    console.log(`   Tiene firma: ${contract.signature_data ? 'Sí' : 'No'}`);
    console.log(`   Creado: ${contract.created_at}`);
  } else {
    console.log('   ❌ Sin contrato generado');
  }
  
  // Verificar inspecciones
  console.log(`\n🔍 INSPECCIONES:`);
  for (const bv of booking.vehicles) {
    const delivery = await prisma.vehicleInspections.findFirst({
      where: { 
        booking_id: booking.id, 
        vehicle_id: bv.car_id, 
        inspection_type: 'delivery' 
      }
    });
    
    const returnInsp = await prisma.vehicleInspections.findFirst({
      where: { 
        booking_id: booking.id, 
        vehicle_id: bv.car_id, 
        inspection_type: 'return' 
      }
    });
    
    console.log(`   ${bv.car.registration_number}:`);
    console.log(`     Entrega: ${delivery ? `ID ${delivery.id}` : '❌ No'}`);
    console.log(`     Devolución: ${returnInsp ? `ID ${returnInsp.id}` : '❌ No'}`);
  }
  
  console.log('\n');
  await prisma.$disconnect();
}

check().catch(console.error);
