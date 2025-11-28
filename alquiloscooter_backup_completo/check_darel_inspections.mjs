import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkInspections() {
  try {
    console.log('🔍 Buscando reserva de Darel Rivero...\n');
    
    const booking = await prisma.carRentalBookings.findFirst({
      where: {
        customer: {
          first_name: 'Darel',
          last_name: 'Rivero'
        }
      },
      include: {
        customer: true,
        vehicles: {
          include: {
            car: true
          }
        }
      },
      orderBy: { id: 'desc' }
    });
    
    if (!booking) {
      console.log('❌ No se encontró reserva de Darel Rivero');
      return;
    }
    
    console.log(`✅ Reserva encontrada: #${booking.id} - ${booking.booking_number}`);
    console.log(`   Cliente: ${booking.customer.first_name} ${booking.customer.last_name}`);
    console.log(`   Fechas: ${booking.pickup_date} → ${booking.return_date}`);
    console.log(`   Status: ${booking.status}\n`);
    
    console.log(`📋 Vehículos en la reserva (${booking.vehicles.length}):`);
    booking.vehicles.forEach((bv, idx) => {
      console.log(`   ${idx + 1}. ID: ${bv.car_id} - ${bv.car.registration_number} (${bv.car.make} ${bv.car.model})`);
    });
    console.log('');
    
    // Obtener inspecciones
    const inspections = await prisma.vehicleInspections.findMany({
      where: {
        booking_id: booking.id
      },
      include: {
        damages: true,
        extras: true
      },
      orderBy: { id: 'asc' }
    });
    
    console.log(`🔎 Inspecciones encontradas (${inspections.length}):\n`);
    
    if (inspections.length === 0) {
      console.log('⚠️  NO HAY INSPECCIONES REGISTRADAS\n');
    } else {
      inspections.forEach((insp, idx) => {
        console.log(`   Inspección #${idx + 1}:`);
        console.log(`     - ID: ${insp.id}`);
        console.log(`     - Tipo: ${insp.inspection_type}`);
        console.log(`     - Vehicle ID: ${insp.vehicle_id || '❌ NULL / NO ASIGNADO'}`);
        console.log(`     - Fecha: ${insp.inspection_date}`);
        console.log(`     - Kilometraje: ${insp.odometer_reading}`);
        console.log(`     - Fotos:`);
        console.log(`        • Frontal: ${insp.front_photo ? '✅' : '❌'}`);
        console.log(`        • Izquierda: ${insp.left_photo ? '✅' : '❌'}`);
        console.log(`        • Trasera: ${insp.rear_photo ? '✅' : '❌'}`);
        console.log(`        • Derecha: ${insp.right_photo ? '✅' : '❌'}`);
        console.log(`        • Odómetro: ${insp.odometer_photo ? '✅' : '❌'}`);
        console.log(`     - Daños: ${insp.damages?.length || 0}`);
        console.log(`     - Extras: ${insp.extras?.length || 0}\n`);
      });
    }
    
    // ANÁLISIS DEL PROBLEMA
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 ANÁLISIS DEL PROBLEMA:\n');
    
    const vehicleIds = booking.vehicles.map(v => v.car_id);
    const deliveryInspections = inspections.filter(i => i.inspection_type === 'DELIVERY' || i.inspection_type === 'delivery');
    const returnInspections = inspections.filter(i => i.inspection_type === 'RETURN' || i.inspection_type === 'return');
    
    console.log(`   Vehículos en reserva: ${vehicleIds.join(', ')}`);
    console.log(`   Inspecciones de SALIDA: ${deliveryInspections.length}`);
    console.log(`   Inspecciones de ENTRADA: ${returnInspections.length}\n`);
    
    if (deliveryInspections.length > 0) {
      console.log('   ✅ Inspecciones de SALIDA:');
      deliveryInspections.forEach(insp => {
        const hasVehicleId = insp.vehicle_id ? '✅' : '❌ NULL';
        const matchesVehicle = vehicleIds.includes(insp.vehicle_id || -1) ? '✅' : '❌';
        console.log(`      - Inspección #${insp.id}: vehicle_id = ${insp.vehicle_id || 'NULL'} ${hasVehicleId} | Coincide con reserva: ${matchesVehicle}`);
      });
    } else {
      console.log('   ❌ NO HAY INSPECCIONES DE SALIDA');
    }
    
    console.log('');
    
    if (returnInspections.length > 0) {
      console.log('   ✅ Inspecciones de ENTRADA:');
      returnInspections.forEach(insp => {
        const hasVehicleId = insp.vehicle_id ? '✅' : '❌ NULL';
        const matchesVehicle = vehicleIds.includes(insp.vehicle_id || -1) ? '✅' : '❌';
        console.log(`      - Inspección #${insp.id}: vehicle_id = ${insp.vehicle_id || 'NULL'} ${hasVehicleId} | Coincide con reserva: ${matchesVehicle}`);
      });
    } else {
      console.log('   ⚠️  NO HAY INSPECCIONES DE ENTRADA');
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Determinar problema específico
    const inspectionsWithoutVehicleId = inspections.filter(i => !i.vehicle_id);
    if (inspectionsWithoutVehicleId.length > 0) {
      console.log('🚨 PROBLEMA DETECTADO:');
      console.log(`   ${inspectionsWithoutVehicleId.length} inspección(es) NO tienen vehicle_id asignado`);
      console.log(`   Esto causa que NO aparezcan en la comparación multivehículo\n`);
      
      console.log('💡 SOLUCIÓN:');
      console.log('   Las inspecciones deben tener vehicle_id asignado para aparecer');
      console.log('   en reservas con múltiples vehículos.\n');
    } else {
      console.log('✅ Todas las inspecciones tienen vehicle_id asignado correctamente\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInspections();
