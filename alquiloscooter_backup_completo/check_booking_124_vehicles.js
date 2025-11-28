const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const booking = await prisma.carRentalBookings.findUnique({
    where: { id: 124 },
    include: {
      vehicles: {
        include: {
          car: {
            select: {
              id: true,
              registration_number: true,
              make: true,
              model: true
            }
          }
        }
      },
      inspections: {
        select: {
          id: true,
          inspection_type: true,
          vehicle_id: true,
          created_at: true
        },
        orderBy: {
          created_at: 'desc'
        }
      }
    }
  });

  console.log('=== RESERVA 124 - DAREL RIVERO ===\n');
  console.log('Vehículos en vehicles:', booking.vehicles.length);
  booking.vehicles.forEach((bv, i) => {
    console.log(`  ${i+1}. ID: ${bv.id}, car_id: ${bv.car_id}, Matrícula: ${bv.car.registration_number}`);
  });

  console.log('\nInspecciones creadas:', booking.inspections.length);
  booking.inspections.forEach((insp, i) => {
    console.log(`  ${i+1}. ID: ${insp.id}, Tipo: ${insp.inspection_type}, vehicle_id: ${insp.vehicle_id}, Fecha: ${insp.created_at}`);
  });

  await prisma.$disconnect();
}

check().catch(e => {
  console.error(e);
  process.exit(1);
});
