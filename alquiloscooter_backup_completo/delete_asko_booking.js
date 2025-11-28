require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function eliminarReservaAsko() {
  try {
    // Buscar la reserva de ASKO de octubre (la que ya existía)
    const asko = await prisma.carRentalCustomers.findFirst({
      where: {
        OR: [
          { first_name: { contains: 'ASKO', mode: 'insensitive' } },
          { last_name: { contains: 'PITKANEN', mode: 'insensitive' } }
        ]
      }
    });
    
    if (!asko) {
      console.log('Cliente ASKO no encontrado');
      return;
    }
    
    // Eliminar su reserva
    const deleted = await prisma.carRentalBookings.deleteMany({
      where: { customer_id: asko.id }
    });
    
    console.log(`✅ Eliminadas ${deleted.count} reserva(s) de ASKO`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

eliminarReservaAsko();
