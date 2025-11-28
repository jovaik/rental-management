import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const prisma = new PrismaClient();

async function checkEneroImports() {
  try {
    // Buscar reservas de enero 2025
    const eneroBookings = await prisma.carRentalBookings.findMany({
      where: {
        booking_number: {
          startsWith: '202501'
        }
      },
      select: {
        id: true,
        booking_number: true,
        car_id: true, // Campo legacy
        customer_id: true,
        status: true,
        vehicles: {
          select: {
            id: true,
            car_id: true
          }
        }
      },
      orderBy: {
        booking_number: 'asc'
      },
      take: 5
    });

    console.log(`\n📅 Reservas de enero 2025 encontradas: ${eneroBookings.length}`);
    
    eneroBookings.forEach((booking, idx) => {
      console.log(`\n${idx + 1}. Reserva ${booking.booking_number}:`);
      console.log(`   - ID: ${booking.id}`);
      console.log(`   - car_id (legacy): ${booking.car_id || 'NULL'}`);
      console.log(`   - customer_id: ${booking.customer_id || 'NULL'}`);
      console.log(`   - status: ${booking.status}`);
      console.log(`   - Vehículos en booking_vehicles: ${booking.vehicles.length}`);
      
      if (booking.vehicles.length > 0) {
        booking.vehicles.forEach((v, vIdx) => {
          console.log(`     ${vIdx + 1}. BV ID: ${v.id}, car_id: ${v.car_id}`);
        });
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkEneroImports();
