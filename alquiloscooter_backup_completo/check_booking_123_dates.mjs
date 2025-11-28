import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function check() {
  try {
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id: 123 },
      include: {
        car: true,
        vehicles: {
          include: { car: true }
        }
      }
    });
    
    if (!booking) {
      console.log('❌ Reserva #123 no encontrada');
      return;
    }
    
    console.log('\n📋 RESERVA #123 - DETALLES COMPLETOS:');
    console.log('='.repeat(60));
    console.log('ID:', booking.id);
    console.log('Cliente:', booking.customer_name);
    console.log('Estado:', booking.status);
    console.log('\n📅 FECHAS (con hora):');
    console.log('pickup_date:', booking.pickup_date);
    console.log('return_date:', booking.return_date);
    
    console.log('\n🚗 VEHÍCULOS:');
    console.log('car_id (principal):', booking.car_id);
    if (booking.car) {
      console.log('  Vehículo:', booking.car.registration_number);
    }
    console.log('vehicles array:', booking.vehicles?.length || 0);
    booking.vehicles?.forEach((v, i) => {
      console.log(`  [${i}] car_id:`, v.car_id, '- Matrícula:', v.car?.registration_number);
    });
    
    // Comprobar si cae dentro del rango del Planning
    const planningStart = new Date('2025-11-02T00:00:00.000Z');
    const planningEnd = new Date('2025-11-16T23:59:59.999Z');
    const pickupDate = new Date(booking.pickup_date);
    const returnDate = new Date(booking.return_date);
    
    console.log('\n🔍 ANÁLISIS DE INCLUSIÓN EN PLANNING (2-16 nov):');
    console.log('Planning start:', planningStart.toISOString());
    console.log('Planning end:', planningEnd.toISOString());
    console.log('Booking pickup:', pickupDate.toISOString());
    console.log('Booking return:', returnDate.toISOString());
    
    const condition1 = pickupDate >= planningStart && pickupDate <= planningEnd;
    const condition2 = returnDate >= planningStart && returnDate <= planningEnd;
    const condition3 = pickupDate <= planningStart && returnDate >= planningEnd;
    
    console.log('\nCondición 1 (pickup en rango):', condition1);
    console.log('Condición 2 (return en rango):', condition2);
    console.log('Condición 3 (abarca todo el rango):', condition3);
    console.log('¿DEBE APARECER?:', condition1 || condition2 || condition3 ? '✅ SÍ' : '❌ NO');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
