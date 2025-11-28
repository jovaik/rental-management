const { PrismaClient } = require('@prisma/client');
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
        booking_vehicles: {
          include: {
            vehicle: true
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
    console.log(`   Vehículos: ${booking.booking_vehicles.length}`);
    
    booking.booking_vehicles.forEach((bv, idx) => {
      console.log(`\n   Vehículo ${idx + 1}:`);
      console.log(`      - ${bv.vehicle.registration} (${bv.vehicle.make} ${bv.vehicle.model})`);
    });

    console.log(`\n   Inspecciones: ${booking.inspections.length}`);
    booking.inspections.forEach((insp, idx) => {
      console.log(`\n   Inspección ${idx + 1}:`);
      console.log(`      - Tipo: ${insp.inspection_type}`);
      console.log(`      - Fecha: ${insp.inspection_date}`);
      console.log(`      - Vehicle ID: ${insp.vehicle_id || 'NO ESPECIFICADO'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLouis();
