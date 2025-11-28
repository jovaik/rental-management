const { PrismaClient } = require('@prisma/client');
require('dotenv/config');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 CORRIGIENDO customer_email...\n');
    
    // Obtener reservas sin email pero con customer_id
    const reservasToFix = await prisma.carRentalBookings.findMany({
      where: {
        customer_email: null,
        customer_id: { not: null }
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    console.log(`Reservas a corregir: ${reservasToFix.length}\n`);

    let corregidas = 0;
    let errores = 0;

    for (const reserva of reservasToFix) {
      if (!reserva.customer || !reserva.customer.email) {
        console.log(`❌ ID ${reserva.id}: Cliente sin email`);
        errores++;
        continue;
      }

      try {
        await prisma.carRentalBookings.update({
          where: { id: reserva.id },
          data: { customer_email: reserva.customer.email }
        });
        
        console.log(`✅ ID ${reserva.id}: "${reserva.customer.email}"`);
        corregidas++;
      } catch (error) {
        console.log(`❌ ID ${reserva.id}: Error - ${error.message}`);
        errores++;
      }
    }

    console.log(`\n📊 RESUMEN:`);
    console.log(`Corregidas: ${corregidas}`);
    console.log(`Errores: ${errores}`);

    // Verificar resultado
    const sinEmailDespues = await prisma.carRentalBookings.count({
      where: { customer_email: null }
    });
    console.log(`\nReservas sin customer_email: ${sinEmailDespues}`);

  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
