require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const now = new Date();
    const startDate = new Date();
    startDate.setMonth(now.getMonth());
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    
    const vehicles = await prisma.carRentalCars.findMany({
      where: {
        ownership_type: 'commission',
        status: 'T',
        bookings: {
          some: {
            pickup_date: {
              gte: startDate,
            },
            status: {
              in: ['confirmed', 'completed'],
            },
          },
        },
      },
      include: {
        bookings: {
          where: {
            pickup_date: {
              gte: startDate,
            },
            status: {
              in: ['confirmed', 'completed'],
            },
          },
        },
      },
    });
    
    console.log('\n✅ RESULTADO DE LA NUEVA CONSULTA:\n');
    console.log('='.repeat(70));
    console.log(`\nVehículos encontrados: ${vehicles.length}\n`);
    
    vehicles.forEach((v, i) => {
      console.log(`${i + 1}. ${v.make} ${v.model} (${v.registration_number})`);
      console.log(`   ID: ${v.id}`);
      console.log(`   Propietario: ${v.owner_name || 'Sin propietario'}`);
      console.log(`   Reservas confirmadas: ${v.bookings.length}`);
      
      v.bookings.forEach((b, bi) => {
        console.log(`     ${bi + 1}. Reserva #${b.id} - ${b.customer_name} - ${b.total_price}€`);
      });
      console.log('');
    });
    
    console.log('='.repeat(70));
    console.log('\n✅ PERFECTO: Solo vehículos CON reservas confirmadas\n');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
