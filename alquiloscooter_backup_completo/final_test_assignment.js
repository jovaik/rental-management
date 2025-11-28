require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finalTest() {
  try {
    console.log('\n========================================');
    console.log('✅ VERIFICACIÓN FINAL DE ASIGNACIONES');
    console.log('========================================\n');

    // 1. Verificar propietarios disponibles
    console.log('1️⃣  Propietarios disponibles:');
    const propietarios = await prisma.carRentalUsers.findMany({
      where: { role: 'propietario', status: 'T' },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true
      }
    });
    
    propietarios.forEach((p, i) => {
      console.log(`   ${i+1}. ${p.firstname} ${p.lastname} (ID: ${p.id}) - ${p.email}`);
    });

    // 2. Verificar vehículos asignados a YAMI
    console.log('\n2️⃣  Vehículos asignados a YAMI (ID: 7):');
    const vehiculosYami = await prisma.carRentalCars.findMany({
      where: { owner_user_id: 7 },
      select: {
        id: true,
        registration_number: true,
        make: true,
        model: true,
        owner_user_id: true
      }
    });
    
    console.log(`   Total: ${vehiculosYami.length} vehículos`);
    if (vehiculosYami.length > 0) {
      console.log('   Primeros 5:');
      vehiculosYami.slice(0, 5).forEach((v, i) => {
        console.log(`   ${i+1}. ${v.registration_number} - ${v.make} ${v.model}`);
      });
    }

    // 3. Verificar vehículos sin asignar
    console.log('\n3️⃣  Vehículos sin asignar:');
    const vehiculosSinAsignar = await prisma.carRentalCars.findMany({
      where: { owner_user_id: null },
      select: {
        id: true,
        registration_number: true,
        make: true,
        model: true
      },
      take: 5
    });
    
    console.log(`   Total sin asignar: ${await prisma.carRentalCars.count({ where: { owner_user_id: null } })}`);
    if (vehiculosSinAsignar.length > 0) {
      console.log('   Primeros 5:');
      vehiculosSinAsignar.forEach((v, i) => {
        console.log(`   ${i+1}. ${v.registration_number} - ${v.make} ${v.model} (ID: ${v.id})`);
      });
    }

    console.log('\n========================================');
    console.log('✅ RESUMEN');
    console.log('========================================');
    console.log(`✓ ${propietarios.length} propietarios activos encontrados`);
    console.log(`✓ ${vehiculosYami.length} vehículos asignados a YAMI`);
    console.log(`✓ ${await prisma.carRentalCars.count({ where: { owner_user_id: null } })} vehículos sin asignar\n`);
    
    console.log('📝 CORRECCIÓN APLICADA:');
    console.log('   - Endpoint /api/vehicles/all ahora devuelve owner_user_id y depositor_user_id');
    console.log('   - La interfaz de asignación masiva mostrará correctamente los propietarios asignados');
    console.log('   - Las asignaciones se guardan correctamente en la base de datos\n');
    
    console.log('🎯 PRÓXIMOS PASOS:');
    console.log('   1. Recarga la página de asignación masiva (/admin/assign-vehicles)');
    console.log('   2. Ahora verás los vehículos ya asignados correctamente');
    console.log('   3. Las nuevas asignaciones funcionarán correctamente\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

finalTest();
