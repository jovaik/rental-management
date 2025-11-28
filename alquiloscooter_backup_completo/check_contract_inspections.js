require('dotenv').config({ path: __dirname + '/app/.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkContractInspections() {
  try {
    console.log('🔍 Verificando inspecciones en contrato de reserva 202510260001\n');
    
    const booking = await prisma.carRentalBookings.findFirst({
      where: { booking_number: '202510260001' },
      include: {
        bookingVehicles: {
          include: {
            carRentalCars: true
          }
        }
      }
    });
    
    if (!booking) {
      console.log('❌ Reserva no encontrada');
      return;
    }
    
    console.log(`✅ Reserva: ${booking.booking_number}`);
    console.log(`   Vehículos: ${booking.bookingVehicles.length}\n`);
    
    // Buscar TODAS las inspecciones de esta reserva
    const deliveryInspections = await prisma.vehicleInspections.findMany({
      where: {
        booking_id: booking.id,
        inspection_type: 'delivery'
      },
      orderBy: { inspection_date: 'desc' }
    });
    
    const returnInspections = await prisma.vehicleInspections.findMany({
      where: {
        booking_id: booking.id,
        inspection_type: 'return'
      },
      orderBy: { inspection_date: 'desc' }
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 INSPECCIONES DISPONIBLES:\n');
    console.log(`   🚗 Salida (delivery): ${deliveryInspections.length}`);
    console.log(`   🔙 Entrada (return): ${returnInspections.length}\n`);
    
    if (deliveryInspections.length > 0) {
      console.log('🚗 INSPECCIONES DE SALIDA:\n');
      deliveryInspections.forEach((insp, idx) => {
        const photos = [
          insp.front_photo,
          insp.left_photo,
          insp.rear_photo,
          insp.right_photo,
          insp.odometer_photo
        ].filter(p => p);
        
        console.log(`   ${idx+1}. ID: ${insp.id} | Vehículo: ${insp.vehicle_id || 'N/A'}`);
        console.log(`      Fecha: ${insp.inspection_date}`);
        console.log(`      Fotos: ${photos.length}/5`);
        console.log(`      Daños: ${insp.has_damages ? 'SÍ' : 'NO'}\n`);
      });
    }
    
    if (returnInspections.length > 0) {
      console.log('🔙 INSPECCIONES DE ENTRADA:\n');
      returnInspections.forEach((insp, idx) => {
        const photos = [
          insp.front_photo,
          insp.left_photo,
          insp.rear_photo,
          insp.right_photo,
          insp.odometer_photo
        ].filter(p => p);
        
        console.log(`   ${idx+1}. ID: ${insp.id} | Vehículo: ${insp.vehicle_id || 'N/A'}`);
        console.log(`      Fecha: ${insp.inspection_date}`);
        console.log(`      Fotos: ${photos.length}/5`);
        console.log(`      Daños: ${insp.has_damages ? 'SÍ' : 'NO'}\n`);
      });
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 CONCLUSIÓN:\n');
    
    // Verificar código del contrato
    console.log('📄 El código actual del contrato solo carga:');
    console.log('   ✅ Inspección de SALIDA (delivery)');
    console.log('   ❌ NO carga inspección de ENTRADA (return)\n');
    
    if (returnInspections.length > 0) {
      console.log('⚠️  PROBLEMA DETECTADO:');
      console.log(`   → Hay ${returnInspections.length} inspección(es) de entrada`);
      console.log('   → Pero NO se incluyen en el contrato PDF');
      console.log('   → El contrato está INCOMPLETO para evidencia legal\n');
    } else {
      console.log('✅ No hay inspecciones de entrada aún (reserva en curso)');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Recomendar estrategia
    console.log('💡 RECOMENDACIÓN:\n');
    console.log('1. Modificar contrato para incluir AMBAS inspecciones');
    console.log('2. Verificar calidad de fotos en PDF');
    console.log('3. Implementar limpieza automática de fotos:\n');
    console.log('   ✅ Si NO hay daños → Eliminar fotos en 72h');
    console.log('   ✅ Si HAY daños → Conservar hasta resolución\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkContractInspections();
