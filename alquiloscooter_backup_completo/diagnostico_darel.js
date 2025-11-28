require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnosticar() {
  try {
    // Buscar reserva de Darel Ribero/Rivero
    const booking = await prisma.carRentalBookings.findFirst({
      where: {
        customer: {
          OR: [
            { first_name: { contains: 'Darel', mode: 'insensitive' } },
            { last_name: { contains: 'Ribero', mode: 'insensitive' } },
            { last_name: { contains: 'Rivero', mode: 'insensitive' } }
          ]
        }
      },
      include: {
        customer: true,
        vehicles: {
          include: {
            car: true
          }
        },
        inspections: true
      },
      orderBy: { id: 'desc' }
    });

    if (!booking) {
      console.log('❌ NO SE ENCONTRÓ RESERVA DE DAREL RIBERO');
      
      // Buscar variantes del nombre
      console.log('\n🔍 Buscando variantes del nombre...');
      const allBookings = await prisma.carRentalBookings.findMany({
        include: { customer: true },
        orderBy: { id: 'desc' },
        take: 15
      });
      
      console.log('\nÚltimas 15 reservas:');
      allBookings.forEach((b, i) => {
        console.log(`  [${i+1}] ${b.booking_number} - ${b.customer.first_name} ${b.customer.last_name}`);
      });
      
      await prisma.$disconnect();
      return;
    }

    console.log('📋 DIAGNÓSTICO RESERVA DAREL RIBERO:');
    console.log('════════════════════════════════════════');
    console.log('ID Reserva:', booking.id);
    console.log('Número:', booking.booking_number);
    console.log('Cliente:', booking.customer.first_name, booking.customer.last_name);
    console.log('Estado:', booking.status);
    console.log('Fecha Inicio:', booking.pickup_date);
    console.log('Fecha Fin:', booking.return_date);
    console.log('');
    console.log('🚗 VEHÍCULOS EN LA RESERVA:');
    if (booking.vehicles && booking.vehicles.length > 0) {
      booking.vehicles.forEach((bv, i) => {
        console.log(`  [${i+1}] ID: ${bv.vehicle_id} | Matrícula: ${bv.car?.registration_number || 'N/A'}`);
      });
    } else {
      console.log('  ⚠️  NO HAY VEHÍCULOS ASIGNADOS');
    }
    console.log('');
    console.log('🔍 INSPECCIONES EXISTENTES:');
    if (booking.inspections.length === 0) {
      console.log('  ⚠️  NO HAY INSPECCIONES REGISTRADAS');
    } else {
      booking.inspections.forEach((insp, i) => {
        console.log(`  [${i+1}] Tipo: ${insp.inspection_type} | Vehículo ID: ${insp.vehicle_id || 'NULL ❌'} | Fecha: ${insp.inspection_date}`);
      });
    }
    
  } catch (error) {
    console.error('ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

diagnosticar();
