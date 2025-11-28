
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '/home/ubuntu/rental_management_app/app/.env' });

const prisma = new PrismaClient();

async function limpiarAsignaciones() {
  try {
    console.log('🧹 LIMPIANDO TODAS LAS ASIGNACIONES DE VEHÍCULOS...\n');

    // 1. Contar vehículos con asignaciones actuales
    const vehiculosConPropietario = await prisma.carRentalCars.count({
      where: { owner_user_id: { not: null } }
    });
    const vehiculosConCesionario = await prisma.carRentalCars.count({
      where: { depositor_user_id: { not: null } }
    });
    const vehiculosConTextoLibre = await prisma.carRentalCars.count({
      where: { 
        OR: [
          { owner_name: { not: null } },
          { owner_contact: { not: null } }
        ]
      }
    });

    console.log('📊 Estado ANTES de limpieza:');
    console.log(`   - Vehículos con owner_user_id: ${vehiculosConPropietario}`);
    console.log(`   - Vehículos con depositor_user_id: ${vehiculosConCesionario}`);
    console.log(`   - Vehículos con campos de texto libre: ${vehiculosConTextoLibre}\n`);

    // 2. Limpiar TODOS los campos de asignación
    const resultado = await prisma.carRentalCars.updateMany({
      data: {
        owner_user_id: null,
        depositor_user_id: null,
        owner_name: null,
        owner_contact: null
      }
    });

    console.log(`✅ ${resultado.count} vehículos limpiados exitosamente\n`);

    // 3. Verificar limpieza
    const verificacion = await prisma.carRentalCars.count({
      where: {
        OR: [
          { owner_user_id: { not: null } },
          { depositor_user_id: { not: null } },
          { owner_name: { not: null } },
          { owner_contact: { not: null } }
        ]
      }
    });

    console.log('📊 Estado DESPUÉS de limpieza:');
    console.log(`   - Vehículos con asignaciones: ${verificacion}`);
    
    if (verificacion === 0) {
      console.log('\n✅ ¡LIMPIEZA COMPLETADA! Todos los vehículos están sin asignar.');
    } else {
      console.log(`\n⚠️  Advertencia: Aún quedan ${verificacion} vehículos con asignaciones`);
    }

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

limpiarAsignaciones();
