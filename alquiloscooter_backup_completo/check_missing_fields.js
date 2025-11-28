const { PrismaClient } = require('@prisma/client');
require('dotenv/config');

const prisma = new PrismaClient();

async function main() {
  try {
    // Revisar todas las reservas importadas (las que tienen @imported.com)
    const importadas = await prisma.carRentalBookings.findMany({
      where: {
        customer_email: {
          contains: '@imported.com'
        }
      },
      select: {
        id: true,
        booking_number: true,
        customer_name: true,
        customer_email: true,
        customer_phone: true,
        customer: {
          select: {
            phone: true
          }
        }
      },
      take: 10
    });

    console.log('\n📊 ANÁLISIS DE CAMPOS FALTANTES:\n');
    
    let sinTelefono = 0;
    
    importadas.forEach(r => {
      if (!r.customer_phone) {
        sinTelefono++;
        console.log(`ID ${r.id}: customer_phone = NULL`);
        if (r.customer?.phone) {
          console.log(`  → Cliente tiene: "${r.customer.phone}"`);
        }
      }
    });

    const totalSinTelefono = await prisma.carRentalBookings.count({
      where: {
        customer_phone: null,
        customer_email: { contains: '@imported.com' }
      }
    });

    console.log(`\n📈 Total reservas importadas sin teléfono: ${totalSinTelefono}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
