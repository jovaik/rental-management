import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  try {
    const total = await prisma.carRentalBookings.count();
    const completed = await prisma.carRentalBookings.count({
      where: { status: 'completed' }
    });
    const feb = await prisma.carRentalBookings.count({
      where: {
        pickup_date: {
          gte: new Date('2025-02-01'),
          lt: new Date('2025-03-01')
        }
      }
    });
    const mar = await prisma.carRentalBookings.count({
      where: {
        pickup_date: {
          gte: new Date('2025-03-01'),
          lt: new Date('2025-04-01')
        }
      }
    });
    
    console.log('📊 Estado de la base de datos:');
    console.log(`  Total de reservas: ${total}`);
    console.log(`  Reservas completadas: ${completed}`);
    console.log(`  Febrero 2025: ${feb}`);
    console.log(`  Marzo 2025: ${mar}`);
    
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
