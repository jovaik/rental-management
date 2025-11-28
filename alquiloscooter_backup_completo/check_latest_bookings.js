require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLatestBookings() {
  try {
    const bookings = await prisma.carRentalBookings.findMany({
      orderBy: { id: 'desc' },
      take: 10,
      include: {
        customer: true,
        vehicles: {
          include: {
            car: true
          }
        }
      }
    });

    console.log(`📋 Últimas ${bookings.length} reservas en el sistema:\n`);
    
    bookings.forEach(booking => {
      console.log(`ID: ${booking.id} | Número: ${booking.booking_number}`);
      console.log(`  Cliente: ${booking.customer?.name || 'Sin cliente'}`);
      console.log(`  Estado: ${booking.status}`);
      console.log(`  Contrato firmado: ${booking.contract_signed ? 'SÍ' : 'NO'}`);
      console.log(`  Vehículos: ${booking.vehicles.length}`);
      booking.vehicles.forEach((bv, idx) => {
        console.log(`    ${idx + 1}. ${bv.car?.make || 'N/A'} ${bv.car?.model || 'N/A'} (${bv.car?.registration || 'N/A'})`);
      });
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestBookings();
