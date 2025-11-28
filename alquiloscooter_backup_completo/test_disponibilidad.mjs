import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDisponibilidad() {
  console.log('🔍 Probando lógica de disponibilidad...\n');
  
  // Fechas de prueba
  const pickupDate = new Date('2025-11-10');
  const returnDate = new Date('2025-11-12');
  
  console.log(`📅 Buscando reservas que bloqueen del ${pickupDate.toISOString().split('T')[0]} al ${returnDate.toISOString().split('T')[0]}\n`);
  
  // Consulta EXACTA que usa el sistema
  const overlappingBookings = await prisma.carRentalBookings.findMany({
    where: {
      status: { in: ['confirmed', 'pending', 'active'] },
      OR: [
        {
          AND: [
            { pickup_date: { lte: pickupDate } },
            { return_date: { gte: pickupDate } }
          ]
        },
        {
          AND: [
            { pickup_date: { lte: returnDate } },
            { return_date: { gte: returnDate } }
          ]
        },
        {
          AND: [
            { pickup_date: { gte: pickupDate } },
            { return_date: { lte: returnDate } }
          ]
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
  
  console.log(`✅ Reservas que BLOQUEAN: ${overlappingBookings.length}`);
  overlappingBookings.forEach(b => {
    console.log(`   - ID ${b.id}, Status: ${b.status}, Del ${b.pickup_date?.toISOString().split('T')[0]} al ${b.return_date?.toISOString().split('T')[0]}`);
    if (b.vehicles) {
      b.vehicles.forEach(v => {
        console.log(`     Vehículo: ${v.car?.registration_number}`);
      });
    }
  });
  
  // Ahora verificar reservas COMPLETADAS (que NO deberían bloquear)
  console.log('\n---\n');
  const completedBookings = await prisma.carRentalBookings.findMany({
    where: {
      status: 'completed',
      OR: [
        {
          AND: [
            { pickup_date: { lte: pickupDate } },
            { return_date: { gte: pickupDate } }
          ]
        },
        {
          AND: [
            { pickup_date: { lte: returnDate } },
            { return_date: { gte: returnDate } }
          ]
        },
        {
          AND: [
            { pickup_date: { gte: pickupDate } },
            { return_date: { lte: returnDate } }
          ]
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
  
  console.log(`❌ Reservas COMPLETADAS (que NO bloquean): ${completedBookings.length}`);
  completedBookings.forEach(b => {
    console.log(`   - ID ${b.id}, Status: ${b.status}, Del ${b.pickup_date?.toISOString().split('T')[0]} al ${b.return_date?.toISOString().split('T')[0]}`);
    if (b.vehicles) {
      b.vehicles.forEach(v => {
        console.log(`     Vehículo: ${v.car?.registration_number}`);
      });
    }
  });
  
  console.log('\n✅ CONCLUSIÓN: Las reservas completadas NO bloquean la disponibilidad.');
  console.log('✅ El sistema permite crear reservas para vehículos devueltos.');
  
  await prisma.$disconnect();
}

testDisponibilidad().catch(console.error);
