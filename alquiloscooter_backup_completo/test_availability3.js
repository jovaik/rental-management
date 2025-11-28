const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAvailability() {
  console.log('🔍 DIAGNÓSTICO VEHÍCULO N 56 6933NGT\n');
  
  const vehicle = await prisma.carRentalCars.findUnique({
    where: { id: 99 }
  });
  
  console.log('✅ Vehículo:', vehicle.registration_number, `(ID: ${vehicle.id})`);
  
  // Buscar TODAS las reservas
  console.log('\n📅 TODAS las reservas del vehículo:');
  
  const allBookings = await prisma.carRentalBookings.findMany({
    where: {
      OR: [
        { car_id: vehicle.id },
        { vehicles: { some: { car_id: vehicle.id } } }
      ]
    },
    orderBy: { pickup_date: 'desc' }
  });
  
  console.log(`Total: ${allBookings.length} reservas\n`);
  
  allBookings.forEach((booking, idx) => {
    console.log(`--- Reserva ${idx + 1} ---`);
    console.log('ID:', booking.id);
    console.log('Status:', booking.status);
    console.log('Pickup:', booking.pickup_date?.toISOString().split('T')[0]);
    console.log('Return:', booking.return_date?.toISOString().split('T')[0]);
    console.log('');
  });
  
  // Buscar reservas del 20-27
  console.log('\n📍 Buscando reservas que incluyan 20-27 Nov 2024:');
  
  const nov20 = new Date('2024-11-20');
  const nov27 = new Date('2024-11-27');
  
  const overlappingOld = await prisma.carRentalBookings.findMany({
    where: {
      OR: [
        { car_id: vehicle.id },
        { vehicles: { some: { car_id: vehicle.id } } }
      ],
      status: { in: ['confirmed', 'pending', 'active'] },
      pickup_date: { lte: nov27 },
      return_date: { gte: nov20 }
    }
  });
  
  console.log(`Conflictos encontrados (método antiguo): ${overlappingOld.length}`);
  
  // Ahora con el método nuevo
  console.log('\n🔬 Simulación nueva reserva 22-30 Nov 2024:');
  
  const nov22 = new Date('2024-11-22T10:00:00');
  const nov30 = new Date('2024-11-30T10:00:00');
  
  const overlappingNew = await prisma.carRentalBookings.findMany({
    where: {
      status: { in: ['confirmed', 'pending', 'active'] },
      OR: [
        {
          car_id: vehicle.id,
          AND: [
            { pickup_date: { lt: nov30 } },
            { return_date: { gt: nov22 } }
          ]
        },
        {
          vehicles: {
            some: { car_id: vehicle.id }
          },
          AND: [
            { pickup_date: { lt: nov30 } },
            { return_date: { gt: nov22 } }
          ]
        }
      ]
    }
  });
  
  console.log(`Conflictos detectados (método NUEVO): ${overlappingNew.length}`);
  
  if (overlappingNew.length > 0) {
    console.log('\n✅ CORRECTO: Debería RECHAZAR la reserva');
    overlappingNew.forEach(b => {
      console.log(`  - Reserva #${b.id} (${b.status})`);
      console.log(`    Del ${b.pickup_date?.toISOString().split('T')[0]} al ${b.return_date?.toISOString().split('T')[0]}`);
    });
  } else {
    console.log('\n❌ ERROR: No detectó conflicto, PERMITIRÍA la reserva');
  }
  
  await prisma.$disconnect();
}

testAvailability().catch(console.error);
