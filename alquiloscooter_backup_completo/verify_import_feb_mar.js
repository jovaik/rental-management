require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyImport() {
  console.log('=== VERIFICACIÓN DE IMPORTACIÓN FEBRERO-MARZO 2025 ===\n');
  
  // Obtener todas las reservas de febrero y marzo
  const reservations = await prisma.carRentalBookings.findMany({
    where: {
      pickup_date: {
        gte: new Date('2025-02-01'),
        lt: new Date('2025-04-01')
      }
    },
    include: {
      customer: true,
      vehicles: {
        include: {
          car: true
        }
      },
      drivers: true
    },
    orderBy: { pickup_date: 'asc' }
  });

  console.log(`Total de reservas encontradas: ${reservations.length}\n`);

  // Análisis detallado
  let sinNombre = 0;
  let sinEmail = 0;
  let vehiculosConflictos = new Map();

  reservations.forEach((booking, idx) => {
    // Verificar datos del cliente
    const hasCustomer = booking.customer_id && booking.customer;
    const customerName = hasCustomer
      ? `${booking.customer.firstName || ''} ${booking.customer.lastName || ''}`.trim()
      : booking.customer_name || 'SIN NOMBRE';
    const customerEmail = hasCustomer ? booking.customer.email : booking.customer_email || 'SIN EMAIL';

    if (!hasCustomer || customerName === 'SIN NOMBRE' || customerName === '') {
      sinNombre++;
    }

    if (!hasCustomer || !customerEmail || customerEmail === 'SIN EMAIL') {
      sinEmail++;
    }

    // Verificar conflictos de vehículos
    if (booking.vehicles && booking.vehicles.length > 0) {
      booking.vehicles.forEach(v => {
        const key = `${v.car_id}-${booking.pickup_date?.toISOString()}-${booking.return_date?.toISOString()}`;
        if (!vehiculosConflictos.has(key)) {
          vehiculosConflictos.set(key, []);
        }
        vehiculosConflictos.get(key).push({
          bookingNumber: booking.booking_number,
          vehicleModel: v.car?.brand + ' ' + v.car?.model || 'Unknown',
          customerName,
          pickupDate: booking.pickup_date
        });
      });
    }

    // Log individual
    console.log(`${idx + 1}. Expediente: ${booking.booking_number || 'SIN NÚMERO'}`);
    console.log(`   Cliente: ${customerName}`);
    console.log(`   Email: ${customerEmail}`);
    console.log(`   Fechas: ${booking.pickup_date?.toISOString().split('T')[0]} → ${booking.return_date?.toISOString().split('T')[0]}`);
    console.log(`   Vehículos: ${booking.vehicles?.map(v => v.car?.brand + ' ' + v.car?.model).join(', ') || 'NINGUNO'}`);
    console.log(`   Conductores: ${booking.drivers?.length || 0}`);
    console.log('');
  });

  // Resumen de problemas
  console.log('\n═══════════════════════════════════════════');
  console.log('         PROBLEMAS DETECTADOS');
  console.log('═══════════════════════════════════════════\n');
  
  console.log(`❌ Reservas sin nombre de cliente: ${sinNombre}`);
  console.log(`❌ Reservas sin email: ${sinEmail}`);

  // Conflictos de vehículos
  let conflictos = 0;
  console.log('\n--- CONFLICTOS DE VEHÍCULOS ---\n');
  vehiculosConflictos.forEach((bookings, key) => {
    if (bookings.length > 1) {
      conflictos++;
      console.log(`⚠️  CONFLICTO #${conflictos}: ${bookings.length} reservas usan el mismo vehículo en las mismas fechas:`);
      bookings.forEach(b => {
        console.log(`   • ${b.bookingNumber}: ${b.vehicleModel} - ${b.customerName}`);
      });
      console.log('');
    }
  });

  if (conflictos === 0) {
    console.log('✅ No se detectaron conflictos de vehículos\n');
  } else {
    console.log(`❌ Total de conflictos: ${conflictos}\n`);
  }

  await prisma.$disconnect();
}

verifyImport().catch(e => {
  console.error('ERROR:', e);
  process.exit(1);
});
