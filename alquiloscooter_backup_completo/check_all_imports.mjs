import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const prisma = new PrismaClient();

async function checkAllImports() {
  try {
    // Buscar reservas donde car_id es NULL pero customer_id existe
    // Estas podrían ser las importadas sin vehículo asignado
    const suspiciousBookings = await prisma.carRentalBookings.findMany({
      where: {
        car_id: null,
        customer_id: { not: null }
      },
      select: {
        id: true,
        booking_number: true,
        car_id: true,
        customer_id: true,
        status: true,
        pickup_date: true,
        vehicles: {
          select: {
            id: true,
            car_id: true
          }
        }
      },
      orderBy: {
        id: 'desc'
      },
      take: 10
    });

    console.log(`\n🔍 Reservas con car_id=NULL pero customer_id válido: ${suspiciousBookings.length}`);
    
    suspiciousBookings.forEach((booking, idx) => {
      console.log(`\n${idx + 1}. Reserva ${booking.booking_number}:`);
      console.log(`   - ID: ${booking.id}`);
      console.log(`   - car_id (legacy): ${booking.car_id || 'NULL'}`);
      console.log(`   - customer_id: ${booking.customer_id}`);
      console.log(`   - status: ${booking.status}`);
      console.log(`   - pickup_date: ${booking.pickup_date}`);
      console.log(`   - Vehículos en booking_vehicles: ${booking.vehicles.length}`);
      
      if (booking.vehicles.length === 0) {
        console.log(`   ⚠️  SIN VEHÍCULOS ASIGNADOS`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllImports();
