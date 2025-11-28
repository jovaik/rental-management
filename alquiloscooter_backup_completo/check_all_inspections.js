require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllInspections() {
  try {
    console.log('🔍 Verificando TODAS las inspecciones de la reserva 202510260001\n');
    
    const booking = await prisma.carRentalBookings.findFirst({
      where: { booking_number: '202510260001' },
      include: {
        inspections: {
          orderBy: { created_at: 'asc' },
          select: {
            id: true,
            inspection_type: true,
            vehicle_id: true,
            created_at: true
          }
        },
        vehicles: {
          include: {
            car: {
              select: {
                id: true,
                registration_number: true
              }
            }
          }
        }
      }
    });
    
    console.log(`📋 Reserva: ${booking.booking_number}`);
    console.log(`🚗 Vehículos: ${booking.vehicles.length}`);
    booking.vehicles.forEach((bv, i) => {
      console.log(`   ${i+1}. ID ${bv.car.id} - ${bv.car.registration_number}`);
    });
    
    console.log(`\n📸 Inspecciones por tipo:\n`);
    
    const delivery = booking.inspections.filter(i => i.inspection_type === 'delivery');
    const returnInsp = booking.inspections.filter(i => i.inspection_type === 'return');
    
    console.log(`📦 ENTREGA (delivery): ${delivery.length} inspecciones`);
    delivery.forEach((insp, idx) => {
      console.log(`   ${idx+1}. ID ${insp.id} - Vehículo ${insp.vehicle_id} - ${insp.created_at}`);
    });
    
    console.log(`\n🔙 DEVOLUCIÓN (return): ${returnInsp.length} inspecciones`);
    returnInsp.forEach((insp, idx) => {
      console.log(`   ${idx+1}. ID ${insp.id} - Vehículo ${insp.vehicle_id} - ${insp.created_at}`);
    });
    
    const totalExpected = booking.vehicles.length * 2; // 2 inspecciones por vehículo (entrada + salida)
    const totalActual = booking.inspections.length;
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 RESUMEN:`);
    console.log(`   Esperadas: ${totalExpected} inspecciones (${booking.vehicles.length} vehículos × 2)`);
    console.log(`   Encontradas: ${totalActual} inspecciones`);
    console.log(`   Fotos esperadas: ${totalExpected * 5} máximo`);
    console.log(`   Fotos reales: ${totalActual * 5} fotos`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
    if (totalActual > totalExpected) {
      console.log(`⚠️  HAY ${totalActual - totalExpected} INSPECCIONES DUPLICADAS`);
      console.log(`⚠️  HAY ${(totalActual - totalExpected) * 5} FOTOS DUPLICADAS\n`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllInspections();
