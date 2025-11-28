import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkBooking() {
  try {
    const bookingId = 124;
    
    console.log(`🔍 Analizando reserva #${bookingId}...\n`);
    
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id: bookingId },
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
    
    console.log(`✅ Reserva: #${booking.id} - ${booking.booking_number}`);
    console.log(`   Cliente: ${booking.customer.first_name} ${booking.customer.last_name}`);
    console.log(`   Fechas: ${booking.pickup_date} → ${booking.return_date}`);
    console.log(`   Status: ${booking.status}\n`);
    
    console.log(`📋 Vehículos (${booking.vehicles.length}):`);
    booking.vehicles.forEach((bv, idx) => {
      console.log(`   ${idx + 1}. car_id: ${bv.car_id} - ${bv.car.registration_number} (${bv.car.make} ${bv.car.model})`);
    });
    console.log('');
    
    // Obtener inspecciones
    const inspections = await prisma.vehicleInspections.findMany({
      where: {
        booking_id: bookingId
      },
      include: {
        damages: true,
        extras: true,
        inspector: {
          select: {
            firstname: true,
            lastname: true
          }
        }
      },
      orderBy: { id: 'asc' }
    });
    
    console.log(`🔎 Inspecciones encontradas (${inspections.length}):\n`);
    
    if (inspections.length === 0) {
      console.log('⚠️  NO HAY INSPECCIONES\n');
      return;
    }
    
    inspections.forEach((insp, idx) => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Inspección #${idx + 1} (ID: ${insp.id}):`);
      console.log(`  Tipo: ${insp.inspection_type}`);
      console.log(`  Vehicle ID: ${insp.vehicle_id !== null ? insp.vehicle_id : '❌ NULL'}`);
      console.log(`  Fecha: ${insp.inspection_date}`);
      console.log(`  Kilometraje: ${insp.odometer_reading || 'N/A'}`);
      console.log(`  Combustible: ${insp.fuel_level || 'N/A'}`);
      console.log(`  Inspector: ${insp.inspector ? `${insp.inspector.firstname} ${insp.inspector.lastname}` : 'N/A'}`);
      console.log(`  Fotos:`);
      console.log(`    • Frontal: ${insp.front_photo ? '✅' : '❌'}`);
      console.log(`    • Izquierda: ${insp.left_photo ? '✅' : '❌'}`);
      console.log(`    • Trasera: ${insp.rear_photo ? '✅' : '❌'}`);
      console.log(`    • Derecha: ${insp.right_photo ? '✅' : '❌'}`);
      console.log(`    • Odómetro: ${insp.odometer_photo ? '✅' : '❌'}`);
      console.log(`  Daños registrados: ${insp.damages?.length || 0}`);
      console.log(`  Extras registrados: ${insp.extras?.length || 0}`);
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMEN Y ANÁLISIS:\n');
    
    const vehicleIds = booking.vehicles.map(v => v.car_id);
    const deliveryInspections = inspections.filter(i => 
      i.inspection_type.toUpperCase() === 'DELIVERY' || 
      i.inspection_type.toUpperCase() === 'CHECKIN'
    );
    const returnInspections = inspections.filter(i => 
      i.inspection_type.toUpperCase() === 'RETURN' || 
      i.inspection_type.toUpperCase() === 'CHECKOUT'
    );
    
    console.log(`Vehículos en reserva: [${vehicleIds.join(', ')}]`);
    console.log(`Inspecciones de SALIDA (delivery/checkin): ${deliveryInspections.length}`);
    console.log(`Inspecciones de ENTRADA (return/checkout): ${returnInspections.length}\n`);
    
    if (deliveryInspections.length > 0) {
      console.log('🚗 Inspecciones de SALIDA:');
      deliveryInspections.forEach(insp => {
        const hasVehicleId = insp.vehicle_id !== null;
        const matchesVehicle = vehicleIds.includes(insp.vehicle_id || -999);
        console.log(`   - ID ${insp.id}: vehicle_id = ${insp.vehicle_id !== null ? insp.vehicle_id : 'NULL'} | Asignado: ${hasVehicleId ? '✅' : '❌'} | Válido: ${matchesVehicle ? '✅' : '❌'}`);
      });
      console.log('');
    }
    
    if (returnInspections.length > 0) {
      console.log('🏁 Inspecciones de ENTRADA:');
      returnInspections.forEach(insp => {
        const hasVehicleId = insp.vehicle_id !== null;
        const matchesVehicle = vehicleIds.includes(insp.vehicle_id || -999);
        console.log(`   - ID ${insp.id}: vehicle_id = ${insp.vehicle_id !== null ? insp.vehicle_id : 'NULL'} | Asignado: ${hasVehicleId ? '✅' : '❌'} | Válido: ${matchesVehicle ? '✅' : '❌'}`);
      });
      console.log('');
    }
    
    // DIAGNÓSTICO
    const inspectionsWithoutVehicleId = inspections.filter(i => i.vehicle_id === null);
    
    if (inspectionsWithoutVehicleId.length > 0) {
      console.log('🚨 PROBLEMA CONFIRMADO:\n');
      console.log(`   ${inspectionsWithoutVehicleId.length} inspección(es) tienen vehicle_id = NULL`);
      console.log(`   Tipos afectados: ${inspectionsWithoutVehicleId.map(i => i.inspection_type).join(', ')}\n`);
      console.log('   ❗ ESTO ES EL BUG: En reservas multivehículo, el componente');
      console.log('   de comparación filtra por vehicle_id, por lo que inspecciones');
      console.log('   con vehicle_id=NULL NO APARECEN en la interfaz.\n');
      console.log('   💡 SOLUCIÓN: Reparar el componente vehicle-inspection.tsx para');
      console.log('   que SIEMPRE envíe el car_id correcto al crear inspecciones.\n');
    } else {
      console.log('✅ Todas las inspecciones tienen vehicle_id asignado\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBooking();
