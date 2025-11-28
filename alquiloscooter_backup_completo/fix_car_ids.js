const { PrismaClient } = require('@prisma/client');
require('dotenv/config');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 BUSCANDO RESERVAS SIN car_id...\n');
    
    // Obtener reservas sin car_id pero con vehicles
    const reservas = await prisma.carRentalBookings.findMany({
      where: {
        car_id: null
      },
      include: {
        vehicles: {
          include: {
            car: true
          }
        }
      },
      orderBy: { id: 'asc' }
    });

    console.log(`Total reservas sin car_id: ${reservas.length}\n`);

    let conVehiculos = 0;
    let sinVehiculos = 0;
    let corregidas = 0;

    for (const reserva of reservas) {
      if (reserva.vehicles && reserva.vehicles.length > 0) {
        conVehiculos++;
        const primerVehiculo = reserva.vehicles[0];
        const carId = primerVehiculo.car_id;

        console.log(`ID ${reserva.id}: car_id NULL → ${carId} (${primerVehiculo.car?.make} ${primerVehiculo.car?.model})`);

        // Corregir el car_id
        await prisma.carRentalBookings.update({
          where: { id: reserva.id },
          data: { car_id: carId }
        });

        corregidas++;
      } else {
        sinVehiculos++;
        console.log(`⚠️  ID ${reserva.id}: Sin vehículos asignados`);
      }
    }

    console.log(`\n📊 RESUMEN:`);
    console.log(`  Reservas sin car_id: ${reservas.length}`);
    console.log(`  Con vehículos: ${conVehiculos}`);
    console.log(`  Sin vehículos: ${sinVehiculos}`);
    console.log(`  ✅ Corregidas: ${corregidas}`);

    // Verificar
    const sinCarIdDespues = await prisma.carRentalBookings.count({
      where: { car_id: null }
    });
    console.log(`\n✅ Reservas sin car_id después: ${sinCarIdDespues}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
