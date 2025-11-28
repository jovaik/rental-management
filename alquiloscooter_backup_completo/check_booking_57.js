require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBooking57() {
  try {
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id: 57 },
      include: {
        vehicles: {
          include: {
            car: true
          }
        },
        customer: true
      }
    });

    if (!booking) {
      console.log('❌ Reserva #57 NO existe en la base de datos');
      return;
    }

    console.log('✅ Reserva #57 encontrada:');
    console.log('- Número de reserva:', booking.booking_number);
    console.log('- Estado:', booking.status);
    console.log('- Cliente:', booking.customer?.name || 'Sin cliente');
    console.log('- Contrato firmado:', booking.contract_signed ? 'SÍ' : 'NO');
    console.log('- Fecha firma:', booking.contract_signed_at || 'Sin fecha');
    console.log('- Vehículos:', booking.vehicles.length);
    
    booking.vehicles.forEach((bv, idx) => {
      console.log(`  ${idx + 1}. ${bv.car.make} ${bv.car.model} (${bv.car.registration})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkBooking57();
