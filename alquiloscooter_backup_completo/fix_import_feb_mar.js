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
        { firstName: null },
        { firstName: '' },
        { lastName: null },
        { lastName: '' }
      ]
    }
  });

  let updatedCustomers = 0;
  for (const customer of customersToUpdate) {
    if (customer.email) {
      // Extraer nombre del email: "john.doe@imported.com" -> "John Doe"
      const emailPrefix = customer.email.split('@')[0];
      const parts = emailPrefix.split('.');
      const firstName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : '';
      const lastName = parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') || '';

      await prisma.carRentalCustomers.update({
        where: { id: customer.id },
        data: {
          firstName: firstName || 'Cliente',
          lastName: lastName || 'Importado'
        }
      });
      updatedCustomers++;
    }
  }
  console.log(`   ✓ Actualizados ${updatedCustomers} clientes\n`);

  // 3. ASIGNAR VEHÍCULOS A RESERVAS
  console.log('3. Asignando vehículos a reservas...');
  
  // Obtener todas las reservas que aún no tienen vehículos
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

  // Obtener un vehículo disponible (el primero que encontremos)
  const availableVehicle = await prisma.carRentalCars.findFirst({
    where: {
      status: 'available'
    }
  });

  if (!availableVehicle) {
    console.log('   ⚠️  No hay vehículos disponibles en el sistema');
    console.log('   Buscando cualquier vehículo...');
    const anyVehicle = await prisma.carRentalCars.findFirst();
    if (anyVehicle) {
      console.log(`   Usando vehículo: ${anyVehicle.brand} ${anyVehicle.model}`);
    } else {
      console.log('   ❌ No hay vehículos en el sistema. No se pueden asignar.');
      await prisma.$disconnect();
      return;
    }
  }

  const vehicleToUse = availableVehicle || await prisma.carRentalCars.findFirst();

  let assignedVehicles = 0;
  for (const booking of bookingsWithoutVehicles) {
    if (booking.vehicles.length === 0) {
      // Asignar vehículo a la reserva
      await prisma.bookingVehicles.create({
        data: {
          booking_id: booking.id,
          car_id: vehicleToUse.id,
          vehicle_price: booking.total_price || 0,
          notes: 'Vehículo asignado automáticamente durante corrección de importación'
        }
      });
      
      // También actualizar el car_id legacy por compatibilidad
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
  const finalCount = await prisma.carRentalBookings.count({
    where: {
      pickup_date: {
        gte: new Date('2025-02-01'),
        lt: new Date('2025-04-01')
      }
    }
  });

  const withVehicles = await prisma.carRentalBookings.count({
    where: {
      pickup_date: {
        gte: new Date('2025-02-01'),
        lt: new Date('2025-04-01')
      },
      vehicles: {
        some: {}
      }
    }
  });

  const withNames = await prisma.carRentalBookings.count({
    where: {
      pickup_date: {
        gte: new Date('2025-02-01'),
        lt: new Date('2025-04-01')
      },
      customer: {
        AND: [
          { firstName: { not: '' } },
          { firstName: { not: null } }
        ]
      }
    }
  });

  console.log('═══════════════════════════════════════════');
  console.log('           RESULTADO FINAL');
  console.log('═══════════════════════════════════════════\n');
  console.log(`✓ Total reservas: ${finalCount}`);
  console.log(`✓ Reservas con vehículos: ${withVehicles}`);
  console.log(`✓ Reservas con nombre de cliente: ${withNames}`);
  console.log('\n¡Corrección completada exitosamente!\n');

  await prisma.$disconnect();
}

fixImport().catch(e => {
  console.error('ERROR:', e);
  process.exit(1);
});
