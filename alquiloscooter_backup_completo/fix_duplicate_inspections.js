require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDuplicates() {
  try {
    console.log('🔧 Eliminando inspecciones duplicadas...\n');
    
    // Eliminar inspecciones duplicadas (IDs 11, 12, 26, 27)
    // Mantenemos solo las IDs 24 y 25 que tienen vehicle_id correcto
    const duplicateIds = [11, 12, 26, 27];
    
    console.log(`📋 Eliminando inspecciones: ${duplicateIds.join(', ')}\n`);
    
    // Primero eliminar los daños relacionados
    const damages = await prisma.inspectionDamages.deleteMany({
      where: {
        inspection_id: {
          in: duplicateIds
        }
      }
    });
    console.log(`   ✅ ${damages.count} daños eliminados`);
    
    // Eliminar las inspecciones
    const inspections = await prisma.vehicleInspections.deleteMany({
      where: {
        id: {
          in: duplicateIds
        }
      }
    });
    console.log(`   ✅ ${inspections.count} inspecciones eliminadas\n`);
    
    // Verificar resultado
    const booking = await prisma.carRentalBookings.findFirst({
      where: { booking_number: '202510260001' }
    });
    
    const remaining = await prisma.vehicleInspections.findMany({
      where: {
        booking_id: booking.id
      },
      select: {
        id: true,
        inspection_type: true,
        vehicle_id: true,
        created_at: true
      },
      orderBy: { created_at: 'asc' }
    });
    
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 RESULTADO FINAL:`);
    console.log(`   Inspecciones restantes: ${remaining.length}`);
    remaining.forEach((insp, idx) => {
      console.log(`   ${idx+1}. ID ${insp.id} - ${insp.inspection_type} - Vehículo ${insp.vehicle_id}`);
    });
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
    console.log(`✅ Inspecciones duplicadas eliminadas correctamente`);
    console.log(`   Total de fotos ahora: ${remaining.length * 5} fotos máximo\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDuplicates();
