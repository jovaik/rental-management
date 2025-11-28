require('dotenv').config({ path: './.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateTestContractDirect() {
  try {
    console.log('🧪 Generando contrato de prueba DIRECTO\n');
    console.log('   Reserva: 202510260001\n');
    
    // Obtener la reserva
    const booking = await prisma.carRentalBookings.findFirst({
      where: { booking_number: '202510260001' },
      include: {
        customer: true,
        vehicles: {
          include: {
            car: true
          }
        }
      }
    });
    
    if (!booking) {
      console.log('❌ Reserva no encontrada');
      return;
    }
    
    console.log(`✅ Reserva encontrada: ${booking.booking_number}`);
    console.log(`   Cliente: ${booking.customer.name}`);
    console.log(`   Vehículos: ${booking.vehicles.length}\n`);
    
    // Obtener inspecciones
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
    console.log('📊 ESTADO DE INSPECCIONES:\n');
    console.log(`   🚗 Salida: ${deliveryInspections.length} inspecciones`);
    console.log(`   🔙 Entrada: ${returnInspections.length} inspecciones\n`);
    
    if (deliveryInspections.length > 0) {
      console.log('📸 FOTOS EN INSPECCIONES DE SALIDA:\n');
      deliveryInspections.slice(0, 2).forEach((insp, idx) => {
        const photos = [
          insp.front_photo,
          insp.left_photo,
          insp.rear_photo,
          insp.right_photo,
          insp.odometer_photo
        ].filter(p => p);
        
        console.log(`   ${idx+1}. Inspección ${insp.id}:`);
        console.log(`      Vehículo: ${insp.vehicle_id || 'N/A'}`);
        console.log(`      Fotos disponibles: ${photos.length}/5`);
        if (photos.length > 0) {
          console.log(`      Rutas:`);
          photos.forEach(p => {
            const fileName = p.split('/').pop();
            console.log(`         - ${fileName}`);
          });
        }
        console.log('');
      });
    }
    
    if (returnInspections.length > 0) {
      console.log('📸 FOTOS EN INSPECCIONES DE ENTRADA:\n');
      returnInspections.slice(0, 2).forEach((insp, idx) => {
        const photos = [
          insp.front_photo,
          insp.left_photo,
          insp.rear_photo,
          insp.right_photo,
          insp.odometer_photo
        ].filter(p => p);
        
        console.log(`   ${idx+1}. Inspección ${insp.id}:`);
        console.log(`      Vehículo: ${insp.vehicle_id || 'N/A'}`);
        console.log(`      Fotos disponibles: ${photos.length}/5`);
        console.log('');
      });
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 ANÁLISIS:\n');
    
    if (deliveryInspections.length === 0) {
      console.log('⚠️  No hay inspecciones de salida disponibles');
      console.log('   → No se puede generar contrato con fotos\n');
    } else if (returnInspections.length === 0) {
      console.log('✅ Hay inspecciones de salida disponibles');
      console.log('⚠️  No hay inspecciones de entrada aún');
      console.log('   → Se puede generar contrato PRELIMINAR (solo salida)\n');
    } else {
      console.log('✅ Hay inspecciones de salida Y entrada');
      console.log('   → Se puede generar contrato COMPLETO (ambas)\n');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📝 PRÓXIMO PASO:\n');
    console.log('Para generar y verificar el contrato:');
    console.log('1. Accede a: https://app.alquiloscooter.com/planning');
    console.log('2. Busca la reserva 202510260001');
    console.log('3. Haz clic en "Generar Contrato"');
    console.log('4. Descarga el PDF y revisa la calidad de las fotos');
    console.log('5. Verifica si se pueden distinguir daños pequeños\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

generateTestContractDirect();
