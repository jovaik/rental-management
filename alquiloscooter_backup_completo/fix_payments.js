require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPayments() {
  console.log('🔧 Corrigiendo sincronización de pagos...\n');

  // Los pagos exitosos fueron de bookings 6, 7, 8, 9, 10
  const bookingIds = [6, 7, 8, 9, 10];

  for (const bookingId of bookingIds) {
    const externalId = `booking_${new Date().getFullYear()}_${String(bookingId).padStart(6, '0')}`;
    
    const result = await prisma.bookingPayments.updateMany({
      where: { 
        booking_id: bookingId,
        gscontrol_id: null
      },
      data: { gscontrol_id: externalId }
    });

    console.log(`✅ Booking ${bookingId}: ${result.count} pagos actualizados con externalId: ${externalId}`);
  }

  console.log('\n✅ CORRECCIÓN COMPLETADA');
  await prisma.$disconnect();
}

fixPayments().catch(err => {
  console.error('❌ ERROR:', err);
  prisma.$disconnect();
});
