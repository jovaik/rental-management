const { PrismaClient } = require('@prisma/client');
require('dotenv/config');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 ANTES DE LA CORRECCIÓN:\n');
    
    // Contar reservas sin nombre
    const sinNombre = await prisma.carRentalBookings.count({
      where: { customer_name: null }
    });
    console.log(`Reservas sin customer_name: ${sinNombre}`);

    // Obtener las 45 reservas a corregir
    const reservasToFix = await prisma.carRentalBookings.findMany({
      where: {
        customer_name: null,
        customer_id: { not: null }
      },
      include: {
        customer: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });

    console.log(`\nReservas a corregir: ${reservasToFix.length}\n`);

    // Corregir una por una
    let corregidas = 0;
    let errores = 0;

    for (const reserva of reservasToFix) {
      if (!reserva.customer) {
        console.log(`❌ ID ${reserva.id}: Cliente no existe`);
        errores++;
        continue;
      }

      const nombreCompleto = `${reserva.customer.first_name} ${reserva.customer.last_name}`.trim();
      
      try {
        await prisma.carRentalBookings.update({
          where: { id: reserva.id },
          data: { customer_name: nombreCompleto }
        });
        
        console.log(`✅ ID ${reserva.id}: "${nombreCompleto}"`);
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
    console.log(`\n🔍 DESPUÉS DE LA CORRECCIÓN:\n`);
    
    const sinNombreDespues = await prisma.carRentalBookings.count({
      where: { customer_name: null }
    });
    console.log(`Reservas sin customer_name: ${sinNombreDespues}`);

    // Mostrar ejemplos corregidos
    const ejemplos = await prisma.carRentalBookings.findMany({
      where: {
        id: { in: [243, 246, 247] }
      },
      select: {
        id: true,
        booking_number: true,
        customer_name: true
      }
    });

    console.log(`\n✅ EJEMPLOS CORREGIDOS:`);
    ejemplos.forEach(r => {
      console.log(`  ID ${r.id}: ${r.customer_name}`);
    });

  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
