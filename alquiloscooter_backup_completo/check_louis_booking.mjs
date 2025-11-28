import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const prisma = new PrismaClient();

async function checkLouis() {
  try {
    const booking = await prisma.carRentalBookings.findFirst({
      where: {
        customer: {
          OR: [
            { first_name: { contains: 'LOUIS', mode: 'insensitive' } },
            { last_name: { contains: 'DEZOOMER', mode: 'insensitive' } }
          ]
        }
      },
      include: {
        vehicles: {
          include: {
            car: true
          }
        },
        inspections: {
          orderBy: { inspection_date: 'desc' }
        }
      }
    });

    if (!booking) {
      console.log('❌ Reserva de LOUIS DEZOOMER no encontrada');
      return;
    }

    console.log('\n✅ Reserva encontrada:');
    console.log(`   ID: ${booking.id}`);
    console.log(`   Número: ${booking.booking_number}`);
    console.log(`   Vehículos en reserva: ${booking.vehicles.length}`);
    
    booking.vehicles.forEach((bv, idx) => {
      console.log(`\n   Vehículo ${idx + 1}:`);
      console.log(`      - ${bv.car.registration} (${bv.car.make} ${bv.car.model})`);
    });

    console.log(`\n   Inspecciones totales: ${booking.inspections.length}`);
    booking.inspections.forEach((insp, idx) => {
      console.log(`\n   Inspección ${idx + 1}:`);
      console.log(`      - Tipo: ${insp.inspection_type}`);
      console.log(`      - Fecha: ${insp.inspection_date}`);
      console.log(`      - Vehicle ID: ${insp.vehicle_id || 'NO ESPECIFICADO'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkLouis();
