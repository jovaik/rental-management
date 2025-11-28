
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== Asignación Automática de Vehículos ===\n');
  
  // Obtener reservas sin vehículo asignado
  const bookingsWithoutVehicle = await prisma.carRentalBookings.findMany({
    where: {
      car_id: null
    },
    select: {
      id: true,
      customer_name: true,
      pickup_date: true,
      return_date: true
    }
  });
  
  // Obtener vehículos activos
  const activeVehicles = await prisma.carRentalCars.findMany({
    where: {
      status: 'T'
    },
    select: {
      id: true,
      registration_number: true,
      make: true,
      model: true
    }
  });
  
  console.log(`📊 Reservas sin vehículo: ${bookingsWithoutVehicle.length}`);
  console.log(`🚗 Vehículos disponibles: ${activeVehicles.length}\n`);
  
  if (bookingsWithoutVehicle.length === 0) {
    console.log('✅ Todas las reservas ya tienen vehículo asignado!');
    return;
  }
  
  if (activeVehicles.length === 0) {
    console.log('❌ No hay vehículos disponibles para asignar!');
    return;
  }
  
  console.log('🔄 Asignando vehículos...\n');
  
  // Asignar un vehículo aleatorio a cada reserva
  let successCount = 0;
  for (const booking of bookingsWithoutVehicle) {
    // Seleccionar un vehículo aleatorio
    const randomIndex = Math.floor(Math.random() * activeVehicles.length);
    const selectedVehicle = activeVehicles[randomIndex];
    
    try {
      await prisma.carRentalBookings.update({
        where: { id: booking.id },
        data: { car_id: selectedVehicle.id }
      });
      
      console.log(`✓ Reserva ${booking.id} (${booking.customer_name}) → ${selectedVehicle.registration_number}`);
      successCount++;
    } catch (error) {
      console.log(`✗ Error asignando reserva ${booking.id}: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Asignaciones completadas: ${successCount}/${bookingsWithoutVehicle.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
