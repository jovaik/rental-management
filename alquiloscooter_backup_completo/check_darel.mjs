import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const reservations = await prisma.bookings.findMany({
    where: {
      customer: {
        full_name: { contains: 'DAREL', mode: 'insensitive' }
      }
    },
    include: {
      customer: true,
      vehicles: {
        include: {
          car: true
        }
      }
    }
  });
  
  console.log('=== RESERVAS DE DAREL ===');
  reservations.forEach(r => {
    console.log(`\nID: ${r.id} | Estado: ${r.status}`);
    console.log(`Cliente: ${r.customer.full_name}`);
    console.log(`Fechas: ${r.pickup_date} → ${r.return_date}`);
    console.log('Vehículos:');
    r.vehicles.forEach(v => {
      console.log(`  - ${v.car.registration_number} (${v.car.make} ${v.car.model})`);
    });
  });
  
  await prisma.$disconnect();
}

main();
