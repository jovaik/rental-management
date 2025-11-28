const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finalCleanup() {
  try {
    console.log('🧹 LIMPIEZA FINAL DE DATOS ANTIGUOS\n');
    
    // 1. Limpiar TODOS los owner_name que tienen owner_user_id asignado
    console.log('📋 Limpiando owner_name donde ya hay owner_user_id...');
    const result1 = await prisma.carRentalCars.updateMany({
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
    console.log(`✅ ${result1.count} vehículos limpiados`);
    
    // 2. Mostrar resumen final
    console.log('\n📊 RESUMEN FINAL:');
    
    const withUserId = await prisma.carRentalCars.count({
      where: { owner_user_id: { not: null } }
    });
    console.log(`   Vehículos con owner_user_id: ${withUserId}`);
    
    const withName = await prisma.carRentalCars.count({
      where: { owner_name: { not: null } }
    });
    console.log(`   Vehículos con owner_name (texto libre): ${withName}`);
    
    const withBoth = await prisma.carRentalCars.count({
      where: {
        AND: [
          { owner_user_id: { not: null } },
          { owner_name: { not: null } }
        ]
      }
    });
    console.log(`   Vehículos con AMBOS (duplicación): ${withBoth} ${withBoth === 0 ? '✅' : '❌'}`);
    
    // 3. Mostrar algunos ejemplos
    console.log('\n📝 EJEMPLOS DE VEHÍCULOS:');
    const examples = await prisma.carRentalCars.findMany({
      where: {
        OR: [
          { owner_user_id: { not: null } },
          { owner_name: { not: null } }
        ]
      },
      select: {
        id: true,
        registration_number: true,
        owner_user_id: true,
        owner_name: true
      },
      take: 10,
      orderBy: { id: 'asc' }
    });
    
    for (const v of examples) {
      const status = v.owner_user_id && v.owner_name ? '❌ AMBOS' : '✅ OK';
      console.log(`   ${status} - ID ${v.id} (${v.registration_number}): user_id=${v.owner_user_id}, name="${v.owner_name}"`);
    }
    
    console.log('\n✅ LIMPIEZA COMPLETADA');
    
  } catch (error) {
    console.error('❌ ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalCleanup();
