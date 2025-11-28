const { PrismaClient } = require('@prisma/client');
require('dotenv/config');

const prisma = new PrismaClient();

async function main() {
  try {
    // Obtener 5 reservas con y sin customer_name
    const reservasConNombre = await prisma.carRentalBookings.findMany({
      where: {
        customer_name: {
          not: null
        }
      },
      select: {
        id: true,
        booking_number: true,
        customer_name: true,
        customer_email: true,
        customer_id: true,
        customer: {
          select: {
            id: true,
            name: true,
            last_name: true,
            email: true
          }
        }
      },
      take: 3,
      orderBy: { id: 'asc' }
    });

    const reservasSinNombre = await prisma.carRentalBookings.findMany({
      where: {
        customer_name: null
      },
      select: {
        id: true,
        booking_number: true,
        customer_name: true,
        customer_email: true,
        customer_id: true,
        customer: {
          select: {
            id: true,
            name: true,
            last_name: true,
            email: true
          }
        }
      },
      take: 3,
      orderBy: { id: 'asc' }
    });

    console.log('📊 ANÁLISIS DE RESERVAS:\n');
    
    console.log(`✅ RESERVAS CON customer_name (${reservasConNombre.length}):`);
    reservasConNombre.forEach(r => {
      console.log(`  ID ${r.id} (${r.booking_number}):`);
      console.log(`    - customer_name: "${r.customer_name}"`);
      console.log(`    - customer_email: "${r.customer_email}"`);
      console.log(`    - customer_id: ${r.customer_id}`);
      if (r.customer) {
        console.log(`    - customer.name: "${r.customer.name} ${r.customer.last_name}"`);
      }
      console.log('');
    });

    console.log(`\n❌ RESERVAS SIN customer_name (${reservasSinNombre.length}):`);
    reservasSinNombre.forEach(r => {
      console.log(`  ID ${r.id} (${r.booking_number}):`);
      console.log(`    - customer_name: ${r.customer_name}`);
      console.log(`    - customer_email: "${r.customer_email}"`);
      console.log(`    - customer_id: ${r.customer_id}`);
      if (r.customer) {
        console.log(`    - customer.name: "${r.customer.name} ${r.customer.last_name}"`);
      } else {
        console.log(`    - customer: NO EXISTE`);
      }
      console.log('');
    });

    const totalSinNombre = await prisma.carRentalBookings.count({
      where: { customer_name: null }
    });

    console.log(`\n📈 RESUMEN:`);
    console.log(`Total reservas SIN customer_name: ${totalSinNombre}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
