
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testDarelChange() {
  console.log('🔍 DIAGNÓSTICO: Cambio de vehículo para Darel Ribero\n');
  
  // 1. Buscar el cliente
  const customer = await prisma.carRentalCustomers.findFirst({
    where: {
      OR: [
        { first_name: { contains: 'Darel', mode: 'insensitive' } },
        { last_name: { contains: 'Ribero', mode: 'insensitive' } }
      ]
    }
  });
  
  if (!customer) {
    console.log('❌ Cliente no encontrado');
    return;
  }
  
  console.log('✅ Cliente encontrado:', customer.first_name, customer.last_name);
  
  // 2. Buscar la última reserva
  const booking = await prisma.carRentalBookings.findFirst({
    where: {
      customer_id: customer.id
    },
    include: {
      vehicles: {
        include: {
          car: true
        }
      }
    },
    orderBy: {
      pickup_date: 'desc'
    }
  });
  
  if (!booking) {
    console.log('❌ No se encontraron reservas');
    return;
  }
  
  console.log('\n📋 RESERVA ENCONTRADA:');
  console.log('  ID:', booking.id);
  console.log('  Fecha recogida:', booking.pickup_date);
  console.log('  Estado:', booking.status);
  console.log('  Vehículos en booking:', booking.vehicles.length);
  
  booking.vehicles.forEach((v, i) => {
    console.log(`\n  Vehículo ${i + 1}:`);
    console.log(`    BookingVehicle ID: ${v.id}`);
    console.log(`    car_id: ${v.car_id}`);
    console.log(`    registration_number: ${v.car?.registration_number}`);
    console.log(`    make/model: ${v.car?.make} ${v.car?.model}`);
    console.log(`    vehicle_price: ${v.vehicle_price}`);
  });
  
  // 3. Verificar vehículos disponibles
  const allVehicles = await prisma.carRentalCars.findMany({
    where: {
      status: 'T'
    },
    select: {
      id: true,
      registration_number: true,
      make: true,
      model: true,
      status: true
    },
    take: 5
  });
  
  console.log('\n🚗 VEHÍCULOS DISPONIBLES (primeros 5):');
  allVehicles.forEach(v => {
    console.log(`  ${v.id} - ${v.registration_number} (${v.make} ${v.model})`);
  });
  
  // 4. Verificar estructura de la respuesta del API
  console.log('\n✅ DIAGNÓSTICO COMPLETADO');
  console.log('\nESTRUCTURA ESPERADA POR EL COMPONENTE:');
  console.log('  - booking.vehicles debe ser un array');
  console.log('  - Cada vehicle debe tener: id, car_id, vehicle_price');
  console.log('  - Cada vehicle.car debe tener: id, registration_number, make, model, status');
  console.log('\nESTRUCTURA RECIBIDA:');
  console.log('  booking.vehicles.length:', booking.vehicles.length);
  console.log('  Primer vehículo tiene car?:', !!booking.vehicles[0]?.car);
  console.log('  Primer vehículo car tiene status?:', !!booking.vehicles[0]?.car?.status);
}

testDarelChange()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
