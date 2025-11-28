require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixImport() {
  console.log('=== CORRECCIÓN DE IMPORTACIÓN FEBRERO-MARZO ===\n');

  // 1. ELIMINAR DUPLICADOS (reservas sin booking_number)
  console.log('1. Eliminando reservas duplicadas sin número de expediente...');
  const deleted = await prisma.carRentalBookings.deleteMany({
    where: {
      pickup_date: {
        gte: new Date('2025-02-01'),
        lt: new Date('2025-04-01')
      },
      booking_number: null
    }
  });
  console.log(`   ✓ Eliminadas ${deleted.count} reservas duplicadas\n`);

  // 2. ACTUALIZAR CLIENTES - Extraer nombres de emails
  console.log('2. Actualizando nombres de clientes...');
  const customersToUpdate = await prisma.carRentalCustomers.findMany({
    where: {
      email: {
        contains: '@imported.com'
      },
      OR: [
        { first_name: '' },
        { last_name: '' }
      ]
    }
  });

  let updatedCustomers = 0;
  for (const customer of customersToUpdate) {
    if (customer.email) {
      // Extraer nombre del email: "john.doe@imported.com" -> "John Doe"
      const emailPrefix = customer.email.split('@')[0];
      const parts = emailPrefix.split('.');
      const firstName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Cliente';
      const lastName = parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') || 'Importado';

      await prisma.carRentalCustomers.update({
        where: { id: customer.id },
        data: {
          first_name: firstName,
          last_name: lastName
        }
      });
      updatedCustomers++;
    }
  }
  console.log(`   ✓ Actualizados ${updatedCustomers} clientes\n`);

  // 3. ASIGNAR VEHÍCULOS A RESERVAS
  console.log('3. Asignando vehículos a reservas...');
  
  // Obtener todas las reservas sin vehículos
  const bookingsWithoutVehicles = await prisma.carRentalBookings.findMany({
    where: {
      pickup_date: {
        gte: new Date('2025-02-01'),
        lt: new Date('2025-04-01')
      }
    },
    include: {
      vehicles: true
    }
  });

  // Obtener un vehículo disponible
  let vehicleToUse = await prisma.carRentalCars.findFirst({
    where: {
      status: 'available'
    }
  });

  if (!vehicleToUse) {
    vehicleToUse = await prisma.carRentalCars.findFirst();
    if (!vehicleToUse) {
      console.log('   ❌ No hay vehículos en el sistema. No se pueden asignar.');
      await prisma.$disconnect();
      return;
    }
  }

  console.log(`   Usando vehículo: ${vehicleToUse.brand} ${vehicleToUse.model} (${vehicleToUse.registration})`);

  let assignedVehicles = 0;
  for (const booking of bookingsWithoutVehicles) {
    if (booking.vehicles.length === 0) {
      // Asignar vehículo a la reserva
      await prisma.bookingVehicles.create({
        data: {
          booking_id: booking.id,
          car_id: vehicleToUse.id,
          vehicle_price: booking.total_price || 0,
          notes: 'Asignado automáticamente en corrección de importación'
        }
      });
      
      // Actualizar car_id legacy
      await prisma.carRentalBookings.update({
        where: { id: booking.id },
        data: { car_id: vehicleToUse.id }
      });
      
      assignedVehicles++;
    }
  }
  console.log(`   ✓ Asignados vehículos a ${assignedVehicles} reservas\n`);

  // 4. VERIFICAR RESULTADO
  console.log('4. Verificando resultado final...');
  const finalBookings = await prisma.carRentalBookings.findMany({
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
      }
    }
  });

  let withVehicles = 0;
  let withNames = 0;

  finalBookings.forEach(booking => {
    if (booking.vehicles.length > 0) withVehicles++;
    if (booking.customer && booking.customer.first_name && booking.customer.first_name !== '') {
      withNames++;
    }
  });

  console.log('═══════════════════════════════════════════');
  console.log('           RESULTADO FINAL');
  console.log('═══════════════════════════════════════════\n');
  console.log(`✓ Total reservas: ${finalBookings.length}`);
  console.log(`✓ Reservas con vehículos: ${withVehicles}`);
  console.log(`✓ Reservas con nombre de cliente: ${withNames}`);
  console.log('\n¡Corrección completada exitosamente!\n');

  await prisma.$disconnect();
}

fixImport().catch(e => {
  console.error('ERROR:', e);
  process.exit(1);
});
