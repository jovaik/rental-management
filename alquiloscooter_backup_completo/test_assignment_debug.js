const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAssignment() {
  try {
    console.log('🔍 ==============================================');
    console.log('🔍 DIAGNÓSTICO COMPLETO DE ASIGNACIONES');
    console.log('🔍 ==============================================\n');
    
    // 1. Listar todos los usuarios propietarios disponibles
    console.log('📋 USUARIOS PROPIETARIOS DISPONIBLES:');
    const owners = await prisma.carRentalUsers.findMany({
      where: { role: 'propietario' },
      select: { id: true, firstname: true, lastname: true, email: true }
    });
    console.log(JSON.stringify(owners, null, 2));
    
    // 2. Listar TODOS los vehículos con sus asignaciones actuales
    console.log('\n🚗 VEHÍCULOS Y SUS ASIGNACIONES ACTUALES:');
    const vehicles = await prisma.carRentalCars.findMany({
      select: {
        id: true,
        registration_number: true,
        owner_user_id: true,
        owner_name: true,
        depositor_user_id: true,
        ownership_type: true
      },
      orderBy: { id: 'asc' }
    });
    
    for (const v of vehicles) {
      console.log(`\nID: ${v.id} - Matrícula: ${v.registration_number}`);
      console.log(`  ownership_type: ${v.ownership_type}`);
      console.log(`  owner_user_id: ${v.owner_user_id}`);
      console.log(`  owner_name (texto libre): ${v.owner_name}`);
      console.log(`  depositor_user_id: ${v.depositor_user_id}`);
    }
    
    // 3. Seleccionar un vehículo específico para la prueba
    const testVehicle = vehicles[0];
    if (!testVehicle) {
      console.log('\n❌ No hay vehículos en la base de datos para probar');
      return;
    }
    
    console.log('\n\n🧪 ==============================================');
    console.log(`🧪 PRUEBA DE ASIGNACIÓN CON VEHÍCULO ${testVehicle.id}`);
    console.log('🧪 ==============================================\n');
    
    // 4. Intentar asignar el primer propietario disponible
    if (owners.length === 0) {
      console.log('❌ No hay usuarios propietarios disponibles');
      return;
    }
    
    const testOwner = owners[0];
    console.log(`📝 Asignando propietario: ${testOwner.firstname} ${testOwner.lastname} (ID: ${testOwner.id})`);
    
    // 5. Actualizar el vehículo
    const updated = await prisma.carRentalCars.update({
      where: { id: testVehicle.id },
      data: {
        owner_user_id: testOwner.id,
        ownership_type: 'deposito_comision'
      }
    });
    
    console.log(`✅ Actualización ejecutada. Resultado:`);
    console.log(`   owner_user_id devuelto: ${updated.owner_user_id}`);
    console.log(`   owner_name devuelto: ${updated.owner_name}`);
    
    // 6. VERIFICACIÓN: Leer el vehículo de nuevo desde la BD
    console.log('\n🔍 VERIFICANDO lectura de BD...');
    const verified = await prisma.carRentalCars.findUnique({
      where: { id: testVehicle.id },
      select: {
        id: true,
        registration_number: true,
        owner_user_id: true,
        owner_name: true,
        depositor_user_id: true,
        ownership_type: true
      }
    });
    
    console.log('\n📊 VALORES EN LA BASE DE DATOS:');
    console.log(JSON.stringify(verified, null, 2));
    
    // 7. Comparar con lo que devuelve el endpoint /api/vehicles/all
    console.log('\n\n🌐 ==============================================');
    console.log('🌐 SIMULANDO /api/vehicles/all');
    console.log('🌐 ==============================================\n');
    
    const allVehicles = await prisma.carRentalCars.findMany({
      select: {
        id: true,
        registration_number: true,
        make: true,
        model: true,
        year: true,
        status: true,
        pricing_group_id: true,
        owner_user_id: true,
        depositor_user_id: true
      },
      orderBy: { created_at: 'desc' }
    });
    
    const ourTestVehicle = allVehicles.find(v => v.id === testVehicle.id);
    console.log(`Vehículo ${testVehicle.id} en /api/vehicles/all:`);
    console.log(JSON.stringify(ourTestVehicle, null, 2));
    
    console.log('\n\n✅ DIAGNÓSTICO COMPLETADO');
    
  } catch (error) {
    console.error('❌ ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAssignment();
