const { PrismaClient } = require('@prisma/client');
require('dotenv/config');

const prisma = new PrismaClient();

async function main() {
  try {
    // Revisar reservas sin customer_email
    const sinEmail = await prisma.carRentalBookings.findMany({
      where: {
        customer_email: null
      },
      select: {
        id: true,
        booking_number: true,
        customer_name: true,
        customer_email: true,
        customer_id: true,
        customer: {
          select: {
            email: true
          }
        }
      },
      take: 10
    });

    console.log(`\n📧 RESERVAS SIN customer_email: ${sinEmail.length}`);
    
    if (sinEmail.length > 0) {
      console.log('\nEjemplos:');
      sinEmail.forEach(r => {
        console.log(`  ID ${r.id} (${r.booking_number}):`);
        console.log(`    customer_name: ${r.customer_name}`);
        console.log(`    customer_email: ${r.customer_email}`);
        if (r.customer) {
          console.log(`    customer.email: ${r.customer.email}`);
        }
        console.log('');
      });
    }

    // Contar total sin email
    const totalSinEmail = await prisma.carRentalBookings.count({
      where: { customer_email: null }
    });

    console.log(`\nTotal reservas sin customer_email: ${totalSinEmail}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
