const { PrismaClient } = require('@prisma/client');
require('dotenv/config');

const prisma = new PrismaClient();

async function main() {
  try {
    const reservas = await prisma.carRentalBookings.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        booking_number: true,
        total_price: true,
        pickup_date: true
      }
    });

    console.log(`Total reservas: ${reservas.length}`);
    
    if (reservas.length > 0) {
      console.log(`\nRango IDs: ${reservas[0].id} - ${reservas[reservas.length - 1].id}`);
      
      const total = reservas.reduce((sum, r) => sum + (parseFloat(r.total_price) || 0), 0);
      console.log(`Total económico: €${total.toFixed(2)}`);
      
      console.log(`\n🔍 PRIMERAS 10 RESERVAS (IDs):`);
      reservas.slice(0, 10).forEach(r => {
        console.log(`  ID ${r.id}: ${r.booking_number} - €${r.total_price}`);
      });
      
      console.log(`\n🔍 ÚLTIMAS 10 RESERVAS (IDs):`);
      reservas.slice(-10).forEach(r => {
        console.log(`  ID ${r.id}: ${r.booking_number} - €${r.total_price}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
