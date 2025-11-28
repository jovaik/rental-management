const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupOwnerNames() {
  try {
    console.log('🧹 LIMPIANDO CAMPOS owner_name DUPLICADOS...\n');
    
    // Buscar todos los vehículos con AMBOS campos llenos
    const vehiclesWithBoth = await prisma.carRentalCars.findMany({
      where: {
        AND: [
          { owner_user_id: { not: null } },
          { owner_name: { not: null } }
        ]
      },
      select: {
        id: true,
        registration_number: true,
        owner_user_id: true,
        owner_name: true
      }
    });
    
    console.log(`📋 Encontrados ${vehiclesWithBoth.length} vehículos con AMBOS campos llenos:\n`);
    
    for (const v of vehiclesWithBoth) {
      console.log(`   - ID ${v.id} (${v.registration_number}): owner_user_id=${v.owner_user_id}, owner_name="${v.owner_name}"`);
    }
    
    if (vehiclesWithBoth.length === 0) {
      console.log('\n✅ No hay vehículos que limpiar');
      return;
    }
    
    console.log(`\n🔧 Limpiando ${vehiclesWithBoth.length} vehículos...`);
    
    // Limpiar el campo owner_name para todos estos vehículos
    const result = await prisma.carRentalCars.updateMany({
      where: {
        AND: [
          { owner_user_id: { not: null } },
          { owner_name: { not: null } }
        ]
      },
      data: {
        owner_name: null
      }
    });
    
    console.log(`\n✅ Limpieza completada: ${result.count} vehículos actualizados`);
    
    // Verificar
    console.log('\n🔍 VERIFICANDO resultado...');
    const stillWithBoth = await prisma.carRentalCars.count({
      where: {
        AND: [
          { owner_user_id: { not: null } },
          { owner_name: { not: null } }
        ]
      }
    });
    
    console.log(`   Vehículos con ambos campos: ${stillWithBoth}`);
    
    if (stillWithBoth === 0) {
      console.log('\n✅✅✅ LIMPIEZA EXITOSA - Ya no hay duplicación de datos');
    } else {
      console.log('\n⚠️  Aún hay vehículos con ambos campos - revisar');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOwnerNames();
