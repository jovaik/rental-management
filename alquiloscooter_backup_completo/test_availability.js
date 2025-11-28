const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAvailability() {
  console.log('🔍 DIAGNÓSTICO DE DISPONIBILIDAD\n');
  
  // 1. Buscar el vehículo 6933NGT
  const vehicle = await prisma.carRentalCars.findFirst({
    where: { registration_number: '6933NGT' }
  });
  
  if (!vehicle) {
    console.log('❌ No se encontró el vehículo 6933NGT');
    process.exit(1);
  }
  
  console.log('✅ Vehículo encontrado:', {
    id: vehicle.id,
    registration: vehicle.registration_number
  });
  
  // 2. Buscar reservas activas del vehículo
  console.log('\n📅 Buscando TODAS las reservas activas...');
  
  const allBookings = await prisma.carRentalBookings.findMany({
    where: {
      OR: [
        { car_id: vehicle.id },
        { vehicles: { some: { car_id: vehicle.id } } }
      ],
      status: { in: ['confirmed', 'pending', 'active'] }
    },
    orderBy: { pickup_date: 'asc' }
  });
  
  console.log('\n📋 Reservas activas encontradas:', allBookings.length);
  
  allBookings.forEach((booking, idx) => {
    console.log(`\n--- Reserva ${idx + 1} ---`);
    console.log('ID:', booking.id);
    console.log('Status:', booking.status);
    console.log('Pickup:', booking.pickup_date);
    console.log('Return:', booking.return_date);
    console.log('car_id:', booking.car_id);
  });
  
  // 3. Simular validación nueva reserva 22-30
  const nov22 = new Date('2024-11-22T10:00:00');
  const nov30 = new Date('2024-11-30T10:00:00');
  
  console.log('\n\n🧪 SIMULACIÓN: Nueva reserva 22-30 Nov 2024');
  console.log('Pickup nueva:', nov22);
  console.log('Return nueva:', nov30);
  
  const overlapping = await prisma.carRentalBookings.findMany({
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
  
  console.log('\n🔍 Resultado validación:');
  console.log('Conflictos encontrados:', overlapping.length);
  
  if (overlapping.length > 0) {
    console.log('✅ CORRECTO: Debería rechazar la reserva');
    overlapping.forEach(b => {
      console.log(`  - Reserva #${b.id} (${b.status}) del ${b.pickup_date?.toISOString().split('T')[0]} al ${b.return_date?.toISOString().split('T')[0]}`);
    });
  } else {
    console.log('❌ ERROR: No detectó conflicto, permitiría la reserva');
  }
  
  await prisma.$disconnect();
}

testAvailability().catch(console.error);
