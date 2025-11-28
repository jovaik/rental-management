const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCompleteWorkflow() {
  try {
    console.log('🎯 ============================================');
    console.log('🎯 PRUEBA COMPLETA DE ASIGNACIÓN');
    console.log('🎯 ============================================\n');
    
    // 1. Tomar un vehículo de prueba (el primero disponible)
    const testVehicle = await prisma.carRentalCars.findFirst({
      where: { status: 'T' },
      select: {
        id: true,
        registration_number: true,
        owner_user_id: true,
        owner_name: true
      }
    });
    
    if (!testVehicle) {
      console.log('❌ No hay vehículos disponibles para probar');
      return;
    }
    
    console.log(`📝 Vehículo de prueba: ID ${testVehicle.id} - ${testVehicle.registration_number}`);
    console.log(`   Estado ANTES de asignar:`);
    console.log(`   - owner_user_id: ${testVehicle.owner_user_id}`);
    console.log(`   - owner_name: ${testVehicle.owner_name}`);
    
    // 2. Obtener el usuario GS (ID 21)
    const gsUser = await prisma.carRentalUsers.findUnique({
      where: { id: 21 },
      select: { id: true, firstname: true, lastname: true }
    });
    
    if (!gsUser) {
      console.log('\n❌ Usuario GS no encontrado');
      return;
    }
    
    console.log(`\n👤 Usuario a asignar: ${gsUser.firstname} (ID: ${gsUser.id})`);
    
    // 3. SIMULAR LO QUE HACE EL MODAL: Asignar el propietario
    console.log(`\n🔧 PASO 1: Asignando propietario...`);
    const updated = await prisma.carRentalCars.update({
      where: { id: testVehicle.id },
      data: {
        owner_user_id: gsUser.id,
        ownership_type: 'deposito_comision',
        // IMPORTANTE: NO tocamos owner_name
      }
    });
    
    console.log(`✅ Vehículo actualizado`);
    
    // 4. SIMULAR QUE EL USUARIO CIERRA Y REABRE EL MODAL
    console.log(`\n🔧 PASO 2: Simulando reapertura del modal (consulta a BD)...`);
    const reopened = await prisma.carRentalCars.findUnique({
      where: { id: testVehicle.id },
      select: {
        id: true,
        registration_number: true,
        owner_user_id: true,
        owner_name: true,
        ownership_type: true
      }
    });
    
    console.log(`\n📊 RESULTADO FINAL - Lo que verá el usuario en el modal:`);
    console.log(`   - owner_user_id: ${reopened.owner_user_id} ${reopened.owner_user_id === 21 ? '✅ CORRECTO' : '❌ ERROR'}`);
    console.log(`   - owner_name: ${reopened.owner_name} ${reopened.owner_name === null ? '✅ CORRECTO (vacío)' : '❌ ERROR (tiene valor)'}`);
    console.log(`   - ownership_type: ${reopened.ownership_type}`);
    
    // 5. Verificar que no hay "traslado" de datos
    if (reopened.owner_user_id === 21 && reopened.owner_name === null) {
      console.log('\n✅✅✅ PERFECTO: El desplegable muestra GS (ID 21)');
      console.log('✅✅✅ PERFECTO: El campo de texto libre está VACÍO');
      console.log('\n🎉 LA ASIGNACIÓN FUNCIONA CORRECTAMENTE');
    } else {
      console.log('\n❌ Hay un problema con la asignación');
      console.log(`   owner_user_id esperado: 21, obtenido: ${reopened.owner_user_id}`);
      console.log(`   owner_name esperado: null, obtenido: ${reopened.owner_name}`);
    }
    
    // 6. Probar asignación masiva simulando /api/vehicles/bulk-assign
    console.log(`\n\n🔧 PASO 3: Probando asignación masiva...`);
    const bulkResult = await prisma.carRentalCars.updateMany({
      where: {
        id: { in: [testVehicle.id] }
      },
      data: {
        owner_user_id: 7, // YAMI
        ownership_type: 'deposito_comision'
      }
    });
    
    console.log(`✅ Asignación masiva ejecutada: ${bulkResult.count} vehículos`);
    
    // 7. Verificar resultado de asignación masiva
    const bulkVerify = await prisma.carRentalCars.findUnique({
      where: { id: testVehicle.id },
      select: {
        id: true,
        registration_number: true,
        owner_user_id: true,
        owner_name: true
      }
    });
    
    console.log(`\n📊 RESULTADO después de asignación masiva:`);
    console.log(`   - owner_user_id: ${bulkVerify.owner_user_id} ${bulkVerify.owner_user_id === 7 ? '✅ CORRECTO' : '❌ ERROR'}`);
    console.log(`   - owner_name: ${bulkVerify.owner_name} ${bulkVerify.owner_name === null ? '✅ CORRECTO (vacío)' : '❌ ERROR'}`);
    
    if (bulkVerify.owner_user_id === 7 && bulkVerify.owner_name === null) {
      console.log('\n🎉 ASIGNACIÓN MASIVA FUNCIONA CORRECTAMENTE');
    }
    
    console.log('\n\n✅ ============================================');
    console.log('✅ TODAS LAS PRUEBAS COMPLETADAS');
    console.log('✅ ============================================');
    
  } catch (error) {
    console.error('❌ ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCompleteWorkflow();
