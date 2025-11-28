
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testContractGeneration() {
  try {
    console.log('\n🧪 TEST: Generación de contrato para reserva #126\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Paso 1: Obtener la reserva completa
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id: 126 },
      include: {
        customer: true,
        car: true,
        vehicles: {
          include: {
            car: true
          }
        }
      }
    });

    if (!booking) {
      console.log('❌ Reserva #126 no encontrada');
      return;
    }

    console.log(`✅ Reserva encontrada: ${booking.booking_number}`);
    console.log(`   Cliente: ${booking.customer.first_name} ${booking.customer.last_name}`);
    console.log(`   Vehículos en reserva: ${booking.vehicles.length}`);
    console.log('');

    // Paso 2: Para CADA vehículo, buscar sus inspecciones
    for (const vb of booking.vehicles) {
      console.log(`\n📋 VEHÍCULO: ${vb.car.make} ${vb.car.model} - ${vb.car.registration_number} (ID: ${vb.car_id})`);
      console.log('   ' + '─'.repeat(80));

      // Buscar inspección de salida (delivery)
      const deliveryInsp = await prisma.vehicleInspections.findFirst({
        where: {
          booking_id: 126,
          vehicle_id: vb.car_id,
          inspection_type: 'delivery'
        },
        orderBy: {
          inspection_date: 'desc'
        }
      });

      if (deliveryInsp) {
        console.log('   ✅ INSPECCIÓN DE SALIDA:');
        console.log(`      ID: ${deliveryInsp.id}`);
        console.log(`      Fecha: ${deliveryInsp.inspection_date}`);
        console.log(`      Fotos:`);
        console.log(`         front_photo: ${deliveryInsp.front_photo ? '✅ ' + deliveryInsp.front_photo.substring(0, 50) + '...' : '❌ NULL'}`);
        console.log(`         left_photo: ${deliveryInsp.left_photo ? '✅ ' + deliveryInsp.left_photo.substring(0, 50) + '...' : '❌ NULL'}`);
        console.log(`         rear_photo: ${deliveryInsp.rear_photo ? '✅ ' + deliveryInsp.rear_photo.substring(0, 50) + '...' : '❌ NULL'}`);
        console.log(`         right_photo: ${deliveryInsp.right_photo ? '✅ ' + deliveryInsp.right_photo.substring(0, 50) + '...' : '❌ NULL'}`);
        console.log(`         odometer_photo: ${deliveryInsp.odometer_photo ? '✅ ' + deliveryInsp.odometer_photo.substring(0, 50) + '...' : '❌ NULL'}`);
      } else {
        console.log('   ❌ Sin inspección de salida');
      }

      // Buscar inspección de devolución (return)
      const returnInsp = await prisma.vehicleInspections.findFirst({
        where: {
          booking_id: 126,
          vehicle_id: vb.car_id,
          inspection_type: 'return'
        },
        orderBy: {
          inspection_date: 'desc'
        }
      });

      if (returnInsp) {
        console.log('   ✅ INSPECCIÓN DE DEVOLUCIÓN:');
        console.log(`      ID: ${returnInsp.id}`);
        console.log(`      Fecha: ${returnInsp.inspection_date}`);
        console.log(`      Fotos:`);
        console.log(`         front_photo: ${returnInsp.front_photo ? '✅ ' + returnInsp.front_photo.substring(0, 50) + '...' : '❌ NULL'}`);
        console.log(`         left_photo: ${returnInsp.left_photo ? '✅ ' + returnInsp.left_photo.substring(0, 50) + '...' : '❌ NULL'}`);
        console.log(`         rear_photo: ${returnInsp.rear_photo ? '✅ ' + returnInsp.rear_photo.substring(0, 50) + '...' : '❌ NULL'}`);
        console.log(`         right_photo: ${returnInsp.right_photo ? '✅ ' + returnInsp.right_photo.substring(0, 50) + '...' : '❌ NULL'}`);
        console.log(`         odometer_photo: ${returnInsp.odometer_photo ? '✅ ' + returnInsp.odometer_photo.substring(0, 50) + '...' : '❌ NULL'}`);
      } else {
        console.log('   ❌ Sin inspección de devolución');
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Paso 3: Simular la llamada al API de contrato
    console.log('📡 Ahora voy a simular una llamada al API de generación de contrato...\n');
    console.log('   URL: GET /api/contracts?bookingId=126');
    console.log('   Esto debería:\n');
    console.log('   1. Buscar las inspecciones de CADA vehículo');
    console.log('   2. Convertir CADA foto a base64 usando getFileAsBase64()');
    console.log('   3. Generar el HTML del contrato con las fotos embebidas\n');
    
    console.log('💡 PARA PROBAR REALMENTE:\n');
    console.log('   1. Abre el navegador');
    console.log('   2. Ve a https://app.alquiloscooter.com/planning');
    console.log('   3. Busca la reserva 202510260001');
    console.log('   4. Haz clic en "Generar Contrato"');
    console.log('   5. Descarga el PDF y verifica si se ven las fotos\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testContractGeneration();
