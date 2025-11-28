import { prisma } from './lib/db';

async function testContract() {
  const bookingId = 126;
  
  console.log('\n\n═══════════════════════════════════════════════════');
  console.log(`🔍 DIAGNÓSTICO COMPLETO - RESERVA #${bookingId}`);
  console.log('═══════════════════════════════════════════════════\n');
  
  // 1. Cargar reserva completa
  const booking = await prisma.carRentalBookings.findUnique({
    where: { id: bookingId },
    include: {
      car: true,
      customer: true,
      vehicles: {
        include: {
          car: true
        }
      },
      drivers: true,
      extras: {
        include: {
          extra: true
        }
      },
      upgrades: {
        include: {
          upgrade: true
        }
      },
    }
  });

  if (!booking) {
    console.error('❌ Reserva no encontrada');
    return;
  }

  console.log('✅ Reserva encontrada');
  console.log(`   Cliente: ${booking.customer?.first_name} ${booking.customer?.last_name}`);
  console.log(`   Fecha: ${booking.pickup_date}`);
  console.log(`   Número de vehículos: ${booking.vehicles?.length || 0}`);
  
  // 2. Verificar vehículos
  if (booking.vehicles && booking.vehicles.length > 0) {
    console.log('\n📋 VEHÍCULOS EN RESERVA:');
    for (const vb of booking.vehicles) {
      console.log(`   - ${vb.car?.make} ${vb.car?.model} (${vb.car?.registration_number}) - ID: ${vb.car_id}`);
      
      // 3. Buscar inspecciones para cada vehículo
      console.log(`\n   🔎 Buscando inspecciones para vehículo ${vb.car_id}...`);
      
      const deliveryInsp = await prisma.vehicleInspections.findFirst({
        where: {
          booking_id: booking.id,
          vehicle_id: vb.car_id,
          inspection_type: 'delivery'
        },
        orderBy: {
          inspection_date: 'desc'
        }
      });

      console.log(`   📸 Inspección de SALIDA: ${deliveryInsp ? '✅ EXISTE' : '❌ NO EXISTE'}`);
      if (deliveryInsp) {
        console.log(`      - front_photo: ${deliveryInsp.front_photo || 'NO'}`);
        console.log(`      - left_photo: ${deliveryInsp.left_photo || 'NO'}`);
        console.log(`      - rear_photo: ${deliveryInsp.rear_photo || 'NO'}`);
        console.log(`      - right_photo: ${deliveryInsp.right_photo || 'NO'}`);
        console.log(`      - odometer_photo: ${deliveryInsp.odometer_photo || 'NO'}`);
      }

      const returnInsp = await prisma.vehicleInspections.findFirst({
        where: {
          booking_id: booking.id,
          vehicle_id: vb.car_id,
          inspection_type: 'return'
        },
        orderBy: {
          inspection_date: 'desc'
        }
      });

      console.log(`   📸 Inspección de DEVOLUCIÓN: ${returnInsp ? '✅ EXISTE' : '❌ NO EXISTE'}`);
      if (returnInsp) {
        console.log(`      - front_photo: ${returnInsp.front_photo || 'NO'}`);
        console.log(`      - left_photo: ${returnInsp.left_photo || 'NO'}`);
        console.log(`      - rear_photo: ${returnInsp.rear_photo || 'NO'}`);
        console.log(`      - right_photo: ${returnInsp.right_photo || 'NO'}`);
        console.log(`      - odometer_photo: ${returnInsp.odometer_photo || 'NO'}`);
      }
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log('FIN DEL DIAGNÓSTICO');
  console.log('═══════════════════════════════════════════════════\n');
}

testContract()
  .catch(console.error)
  .finally(() => process.exit(0));
