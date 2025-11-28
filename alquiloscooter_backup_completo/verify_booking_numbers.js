require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyBookingNumbers() {
  try {
    const bookings = await prisma.carRentalBookings.findMany({
      select: {
        id: true,
        booking_number: true,
        pickup_date: true,
        customer_name: true
      },
      orderBy: {
        pickup_date: 'desc'
      }
    });
    
    console.log('\n📋 RESERVAS CON NÚMEROS DE EXPEDIENTE:\n');
    console.log('═'.repeat(90));
    console.log('ID  | Expediente    | Fecha Recogida    | Cliente');
    console.log('═'.repeat(90));
    
    for (const booking of bookings) {
      const date = booking.pickup_date ? booking.pickup_date.toISOString().split('T')[0] : 'N/A';
      const expediente = booking.booking_number || 'SIN ASIGNAR';
      const cliente = booking.customer_name || 'N/A';
      
      console.log(`${booking.id.toString().padEnd(4)}| ${expediente.padEnd(14)}| ${date.padEnd(18)}| ${cliente}`);
    }
    
    console.log('═'.repeat(90));
    
    const sinExpediente = bookings.filter(b => !b.booking_number).length;
    
    if (sinExpediente > 0) {
      console.log(`\n⚠️  ${sinExpediente} reservas sin número de expediente`);
    } else {
      console.log('\n✅ Todas las reservas tienen número de expediente');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyBookingNumbers();
