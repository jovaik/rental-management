import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function updateBooking() {
  await prisma.carRentalBookings.update({
    where: { id: 112 },
    data: { gscontrol_external_id: 'booking_2025_000112' }
  });
  console.log('✅ Actualizado gscontrol_external_id para booking #112');
  
  const booking = await prisma.carRentalBookings.findUnique({
    where: { id: 112 }
  });
  console.log('📋 Booking #112:');
  console.log('   gscontrol_external_id:', booking?.gscontrol_external_id);
}

updateBooking()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
