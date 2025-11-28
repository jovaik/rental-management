const { PrismaClient } = require('@prisma/client');
require('dotenv/config');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 CORRIGIENDO customer_phone...\n');
    
    // Obtener reservas sin teléfono
    const reservasToFix = await prisma.carRentalBookings.findMany({
      where: {
        customer_phone: null,
        customer_id: { not: null }
      },
      include: {
        customer: {
          select: {
            id: true,
            phone: true
          }
        }
      }
    });

    console.log(`Reservas a corregir: ${reservasToFix.length}\n`);

    let corregidas = 0;
    let conTelefono = 0;
    let sinTelefono = 0;

    for (const reserva of reservasToFix) {
      let telefono = '';
      
      if (reserva.customer?.phone && reserva.customer.phone.trim()) {
        telefono = reserva.customer.phone.trim();
        conTelefono++;
      } else {
        telefono = 'Sin teléfono';
        sinTelefono++;
      }

      try {
        await prisma.carRentalBookings.update({
          where: { id: reserva.id },
          data: { customer_phone: telefono }
        });
        
        console.log(`✅ ID ${reserva.id}: "${telefono}"`);
        corregidas++;
      } catch (error) {
        console.log(`❌ ID ${reserva.id}: Error - ${error.message}`);
      }
    }

    console.log(`\n📊 RESUMEN:`);
    console.log(`Total corregidas: ${corregidas}`);
    console.log(`Con teléfono real: ${conTelefono}`);
    console.log(`Con placeholder: ${sinTelefono}`);

    // Verificar resultado
    const sinTelefonoDespues = await prisma.carRentalBookings.count({
      where: { customer_phone: null }
    });
    console.log(`\nReservas sin customer_phone: ${sinTelefonoDespues}`);

  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
