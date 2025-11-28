const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkN48() {
  console.log('🔍 Verificando vehículo N48...\n');
  
  try {
    // 1. Buscar el vehículo N48
    const vehicle = await prisma.carRentalCars.findFirst({
      where: {
        registration_number: 'N48'
      }
    });
    
    if (!vehicle) {
      console.log('❌ Vehículo N48 NO EXISTE en la base de datos');
      return;
    }
    
    console.log('✅ Vehículo N48 encontrado:');
    console.log(JSON.stringify(vehicle, null, 2));
    console.log('\n📊 Detalles clave:');
    console.log('- ID:', vehicle.id);
    console.log('- Matrícula:', vehicle.registration_number);
    console.log('- Marca/Modelo:', vehicle.make, vehicle.model);
    console.log('- Status:', vehicle.status, vehicle.status === 'T' ? '(ACTIVO ✅)' : '(INACTIVO ❌)');
    console.log('- Grupo de precios:', vehicle.pricing_group_id);
    
    // 2. Verificar reservas ACTIVAS (que deberían aparecer en Planning)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(today.getDate() + 14);
    
    console.log('\n\n🔍 Reservas ACTIVAS en los próximos 14 días...\n');
    console.log(`Rango: ${today.toISOString().split('T')[0]} → ${twoWeeksLater.toISOString().split('T')[0]}`);
    
    // Reservas principales
    const activeMainBookings = await prisma.carRentalBookings.findMany({
      where: {
        car_id: vehicle.id,
        OR: [
          {
            pickup_date: {
              gte: today,
              lte: twoWeeksLater
            }
          },
          {
            return_date: {
              gte: today,
              lte: twoWeeksLater
            }
          },
          {
            AND: [
              { pickup_date: { lte: today } },
              { return_date: { gte: twoWeeksLater } }
            ]
          }
        ]
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
    
    console.log(`\n✅ Reservas principales activas: ${activeMainBookings.length}`);
    activeMainBookings.forEach(b => {
      console.log(`\n  📌 Reserva #${b.id}`);
      console.log(`     Cliente: ${b.customer_name}`);
      console.log(`     Fechas: ${b.pickup_date.toISOString().split('T')[0]} → ${b.return_date.toISOString().split('T')[0]}`);
      console.log(`     Status: ${b.status}`);
      console.log(`     car_id: ${b.car_id}`);
      if (b.vehicles && b.vehicles.length > 0) {
        console.log(`     Vehículos adicionales:`, b.vehicles.map(v => `${v.car?.registration_number} (ID: ${v.car_id})`).join(', '));
      }
    });
    
    // Reservas adicionales
    const activeAdditionalBookings = await prisma.carRentalBookingVehicles.findMany({
      where: {
        car_id: vehicle.id,
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
                gte: today,
                lte: twoWeeksLater
              }
            },
            {
              AND: [
                { pickup_date: { lte: today } },
                { return_date: { gte: twoWeeksLater } }
              ]
            }
          ]
        }
      },
      include: {
        booking: {
          include: {
            customer: true,
            car: true,
            vehicles: {
              include: {
                car: true
              }
            }
          }
        }
      }
    });
    
    console.log(`\n✅ Reservas adicionales activas: ${activeAdditionalBookings.length}`);
    activeAdditionalBookings.forEach(bv => {
      const b = bv.booking;
      console.log(`\n  📌 Reserva #${b.id}`);
      console.log(`     Cliente: ${b.customer_name}`);
      console.log(`     Fechas: ${b.pickup_date.toISOString().split('T')[0]} → ${b.return_date.toISOString().split('T')[0]}`);
      console.log(`     Status: ${b.status}`);
      console.log(`     Vehículo principal: ${b.car?.registration_number} (ID: ${b.car_id})`);
      console.log(`     Todos los vehículos:`, b.vehicles.map(v => `${v.car?.registration_number} (ID: ${v.car_id})`).join(', '));
    });
    
    // Resumen final
    console.log('\n\n📊 RESUMEN PARA N48:');
    console.log('===================');
    console.log(`Status del vehículo: ${vehicle.status === 'T' ? '✅ ACTIVO' : '❌ INACTIVO'}`);
    console.log(`Reservas activas (próximos 14 días): ${activeMainBookings.length + activeAdditionalBookings.length}`);
    
    if (vehicle.status !== 'T') {
      console.log('\n⚠️  PROBLEMA IDENTIFICADO: El vehículo N48 está INACTIVO (status = F)');
      console.log('   Solución: Activar el vehículo desde la sección Vehículos del sistema');
    }
    
    if (activeMainBookings.length === 0 && activeAdditionalBookings.length === 0) {
      console.log('\n⚠️  INFO: N48 no tiene reservas en los próximos 14 días');
      console.log('   El Planning solo muestra vehículos con reservas en ese rango');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkN48();
