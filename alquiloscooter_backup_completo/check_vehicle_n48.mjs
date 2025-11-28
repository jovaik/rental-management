import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const prisma = new PrismaClient();

async function checkN48() {
  console.log('🔍 Verificando N 48 C0362BWV (ID: 72)...\n');
  
  try {
    const vehicle = await prisma.carRentalCars.findUnique({
      where: { id: 72 }
    });
    
    if (!vehicle) {
      console.log('❌ Vehículo no encontrado');
      return;
    }
    
    console.log('✅ Vehículo:', vehicle.registration_number);
    console.log('   Status:', vehicle.status === 'T' ? '✅ ACTIVO' : '❌ INACTIVO');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(today.getDate() + 14);
    
    console.log(`\n📅 Buscando reservas: ${today.toISOString().split('T')[0]} → ${twoWeeksLater.toISOString().split('T')[0]}`);
    
    // Reservas principales
    const mainBookings = await prisma.carRentalBookings.findMany({
      where: {
        car_id: 72,
        OR: [
          {
            pickup_date: {
              gte: today,
              lte: twoWeeksLater
            }
          },
          {
            return_date: {
              gte: today
            }
          }
        ]
      },
      include: {
        vehicles: {
          include: {
            car: true
          }
        }
      }
    });
    
    console.log(`\n✅ Reservas principales: ${mainBookings.length}`);
    mainBookings.forEach(b => {
      console.log(`\n  📌 Reserva #${b.id}`);
      console.log(`     Cliente: ${b.customer_name}`);
      console.log(`     ${b.pickup_date.toISOString().split('T')[0]} → ${b.return_date.toISOString().split('T')[0]}`);
      console.log(`     Status: ${b.status}`);
      if (b.vehicles?.length > 0) {
        console.log(`     Vehículos adicionales:`, b.vehicles.map(v => v.car?.registration_number).join(', '));
      }
    });
    
    // Reservas adicionales
    const additionalBookings = await prisma.carRentalBookingVehicles.findMany({
      where: {
        car_id: 72,
        booking: {
          OR: [
            {
              pickup_date: {
                gte: today,
                lte: twoWeeksLater
              }
            },
            {
              return_date: {
                gte: today
              }
            }
          ]
        }
      },
      include: {
        booking: {
          include: {
            car: true
          }
        }
      }
    });
    
    console.log(`\n✅ Reservas adicionales: ${additionalBookings.length}`);
    additionalBookings.forEach(bv => {
      const b = bv.booking;
      console.log(`\n  📌 Reserva #${b.id}`);
      console.log(`     Cliente: ${b.customer_name}`);
      console.log(`     ${b.pickup_date.toISOString().split('T')[0]} → ${b.return_date.toISOString().split('T')[0]}`);
      console.log(`     Principal: ${b.car?.registration_number}`);
    });
    
    console.log('\n\n📊 RESUMEN:');
    console.log('===========');
    console.log(`Total reservas activas: ${mainBookings.length + additionalBookings.length}`);
    
    if (mainBookings.length + additionalBookings.length === 0) {
      console.log('\n⚠️  N 48 no tiene reservas en los próximos 14 días');
      console.log('   Por eso NO aparece en el Planning');
    } else {
      console.log('\n⚠️  N 48 TIENE reservas pero NO aparece en Planning');
      console.log('   Esto indica un problema en el filtrado del Planning');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkN48();
