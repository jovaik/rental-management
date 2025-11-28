const { PrismaClient } = require('@prisma/client');
require('dotenv/config');

const prisma = new PrismaClient();

async function main() {
  try {
    // Reservas sin customer_name
    const sinNombre = await prisma.carRentalBookings.findMany({
      where: {
        customer_name: null
      },
      select: {
        id: true,
        booking_number: true,
        customer_id: true,
        customer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      },
      take: 5,
      orderBy: { id: 'asc' }
    });

    console.log('❌ RESERVAS SIN customer_name EN BD:\n');
    sinNombre.forEach(r => {
      console.log(`ID ${r.id} (${r.booking_number}):`);
      console.log(`  customer_id: ${r.customer_id}`);
      if (r.customer) {
        console.log(`  Cliente: ${r.customer.first_name} ${r.customer.last_name}`);
        console.log(`  Email: ${r.customer.email}`);
      } else {
        console.log(`  Cliente: NO EXISTE EN BD`);
      }
      console.log('');
    });

    const totalSinNombre = await prisma.carRentalBookings.count({
      where: { customer_name: null }
    });

    console.log(`\nTotal reservas SIN customer_name: ${totalSinNombre}`);

    // Reservas con customer_name
    const conNombre = await prisma.carRentalBookings.findMany({
      where: {
        customer_name: { not: null }
      },
      select: {
        id: true,
        booking_number: true,
        customer_name: true,
        customer_id: true
      },
      take: 3,
      orderBy: { id: 'asc' }
    });

    console.log(`\n✅ RESERVAS CON customer_name: ${conNombre.length}`);
    conNombre.forEach(r => {
      console.log(`  ID ${r.id}: ${r.customer_name}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
