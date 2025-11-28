import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function findBookings() {
  try {
    // Buscar reservas que terminen el 10 de noviembre 2025
    const bookings = await prisma.carRentalBookings.findMany({
      where: {
        return_date: {
          gte: new Date('2025-11-10T00:00:00Z'),
          lte: new Date('2025-11-10T23:59:59Z')
        }
      },
      include: {
        car: true,
        vehicles: {
          include: { car: true }
        }
      },
      orderBy: {
        id: 'asc'
      }
    });
    
    console.log(`\n📋 RESERVAS QUE TERMINAN EL 10 DE NOVIEMBRE:`);
    console.log('='.repeat(50));
    
    if (bookings.length === 0) {
      console.log('❌ No hay reservas que terminen el 10 de noviembre');
      return;
    }
    
    bookings.forEach(b => {
      console.log(`\nReserva #${b.id}`);
      console.log(`  Booking Number: ${b.booking_number || 'N/A'}`);
      console.log(`  Cliente: ${b.customer_name}`);
      console.log(`  Estado: ${b.status}`);
      console.log(`  Inicio: ${new Date(b.pickup_date).toISOString().split('T')[0]}`);
      console.log(`  Fin: ${new Date(b.return_date).toISOString().split('T')[0]}`);
      console.log(`  car_id: ${b.car_id || 'null'}`);
      if (b.car) {
        console.log(`  Vehículo: ${b.car.registration_number}`);
      }
      console.log(`  Vehículos múltiples: ${b.vehicles?.length || 0}`);
      b.vehicles?.forEach((v, i) => {
        console.log(`    - Vehículo ${i+1}: ${v.car?.registration_number || 'N/A'}`);
      });
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findBookings();
