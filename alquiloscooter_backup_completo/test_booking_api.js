const { PrismaClient } = require('@prisma/client');
require('dotenv/config');

const prisma = new PrismaClient();

async function main() {
  try {
    // Probar con una de las reservas que no tenían nombre
    const bookingId = 243;
    
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        vehicles: {
          include: {
            car: true
          }
        },
        drivers: true
      }
    });

    console.log('\n📋 DATOS DE RESERVA ID 243:\n');
    console.log('booking_number:', booking.booking_number);
    console.log('customer_name:', booking.customer_name);
    console.log('customer_email:', booking.customer_email);
    console.log('customer_phone:', booking.customer_phone);
    console.log('customer_id:', booking.customer_id);
    console.log('\nCliente relacionado:');
    console.log('  first_name:', booking.customer?.first_name);
    console.log('  last_name:', booking.customer?.last_name);
    console.log('  email:', booking.customer?.email);
    console.log('  phone:', booking.customer?.phone);
    
    console.log('\nVehículos:', booking.vehicles?.length || 0);
    console.log('Conductores:', booking.drivers?.length || 0);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
