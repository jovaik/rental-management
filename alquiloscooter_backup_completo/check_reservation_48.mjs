import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function checkReservation() {
  try {
    const booking = await prisma.carRentalBookings.findFirst({
      where: { id: 48 },
      include: {
        car: true,
        vehicles: {
          include: { car: true }
        }
      }
    });
    
    if (!booking) {
      console.log('❌ Reserva #48 no encontrada');
      return;
    }
    
    console.log('\n📋 RESERVA #48:');
    console.log('===============');
    console.log('ID:', booking.id);
    console.log('Booking Number:', booking.booking_number);
    console.log('Cliente:', booking.customer_name);
    console.log('Estado:', booking.status);
    console.log('Fecha inicio:', booking.pickup_date);
    console.log('Fecha fin:', booking.return_date);
    console.log('Vehículo principal (car_id):', booking.car_id);
    if (booking.car) {
      console.log('  - Matrícula:', booking.car.registration_number);
    }
    console.log('Vehículos múltiples:', booking.vehicles?.length || 0);
    booking.vehicles?.forEach((v, i) => {
      console.log(`  Vehículo ${i+1}:`, v.car?.registration_number);
    });
    
    // Comprobar fechas
    const now = new Date();
    const pickup = new Date(booking.pickup_date);
    const returnDate = new Date(booking.return_date);
    
    console.log('\n📅 ANÁLISIS DE FECHAS:');
    console.log('Hoy:', now.toISOString().split('T')[0]);
    console.log('Recogida:', pickup.toISOString().split('T')[0]);
    console.log('Devolución:', returnDate.toISOString().split('T')[0]);
    console.log('¿Ya pasó?', returnDate < now ? '✅ Sí (terminada)' : '❌ No (activa/futura)');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkReservation();
