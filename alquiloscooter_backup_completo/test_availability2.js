const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAvailability() {
  console.log('🔍 DIAGNÓSTICO DE DISPONIBILIDAD\n');
  
  // 1. Buscar vehículos con "6933" en el registro
  const vehicles = await prisma.carRentalCars.findMany({
    where: {
      OR: [
        { registration_number: { contains: '6933', mode: 'insensitive' } },
        { registration_number: { contains: 'NGT', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      registration_number: true,
      make: true,
      model: true
    }
  });
  
  console.log(`✅ Vehículos encontrados con "6933" o "NGT": ${vehicles.length}`);
  vehicles.forEach(v => {
    console.log(`  - ID: ${v.id}, Matrícula: ${v.registration_number}, ${v.make} ${v.model}`);
  });
  
  if (vehicles.length === 0) {
    console.log('\n⚠️ No se encontró ningún vehículo con esa matrícula');
    console.log('\nBuscando vehículo ID 56...');
    
    const vehicleById = await prisma.carRentalCars.findUnique({
      where: { id: 56 }
    });
    
    if (vehicleById) {
      console.log('✅ Vehículo ID 56 encontrado:', vehicleById.registration_number);
      vehicles.push(vehicleById);
    } else {
      console.log('❌ Vehículo ID 56 no existe');
      await prisma.$disconnect();
      return;
    }
  }
  
  const vehicle = vehicles[0];
  
  // 2. Buscar reservas activas del vehículo
  console.log(`\n📅 Buscando TODAS las reservas del vehículo ${vehicle.registration_number}...`);
  
  const allBookings = await prisma.carRentalBookings.findMany({
    where: {
      OR: [
        { car_id: vehicle.id },
        { vehicles: { some: { car_id: vehicle.id } } }
      ]
    },
    orderBy: { pickup_date: 'desc' },
    take: 10
  });
  
  console.log(`\n📋 Últimas 10 reservas: ${allBookings.length}`);
  
  allBookings.forEach((booking, idx) => {
    console.log(`\n--- Reserva ${idx + 1} ---`);
    console.log('ID:', booking.id);
    console.log('Status:', booking.status);
    console.log('Pickup:', booking.pickup_date?.toISOString().split('T')[0]);
    console.log('Return:', booking.return_date?.toISOString().split('T')[0]);
    console.log('car_id:', booking.car_id);
  });
  
  await prisma.$disconnect();
}

testAvailability().catch(console.error);
