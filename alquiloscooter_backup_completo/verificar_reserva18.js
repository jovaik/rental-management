const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const reserva18 = await prisma.carRentalBookings.findUnique({
      where: { id: 18 },
      select: {
        id: true,
        car_id: true,
        customer_name: true,
        total_price: true,
        status: true,
        pickup_date: true,
        return_date: true,
      }
    });
    
    console.log('\n🔍 Reserva #18:\n', JSON.stringify(reserva18, null, 2));
    
    const now = new Date();
    const startDate = new Date();
    startDate.setMonth(now.getMonth());
    startDate.setDate(1);
    
    console.log('\n📅 Fechas:');
    console.log('Fecha de inicio del mes:', startDate.toISOString());
    console.log('Pickup date de la reserva:', reserva18?.pickup_date?.toISOString());
    console.log('¿Está en este mes?', reserva18?.pickup_date >= startDate);
    console.log('Estado:', reserva18?.status);
    console.log('¿Es confirmed o completed?', ['confirmed', 'completed'].includes(reserva18?.status || ''));
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
