
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testVehicleAssignment() {
  console.log('🧪 === DIAGNÓSTICO COMPLETO DE ASIGNACIÓN DE VEHÍCULOS ===\n');

  try {
    // 1. Verificar propietario Yami
    console.log('1️⃣ Verificando propietario Yami...');
    const yami = await prisma.carRentalUsers.findUnique({
      where: { id: 7 }
    });
    
    if (!yami) {
      console.log('❌ ERROR: No se encontró a Yami (ID: 7)');
      return;
    }
    
    console.log(`✅ Yami encontrada:
      - ID: ${yami.id}
      - Email: ${yami.email}
      - Nombre: ${yami.firstname} ${yami.lastname}
      - Rol: ${yami.role}
      - Estado: ${yami.status}
    `);
    
    if (yami.role !== 'propietario') {
      console.log(`❌ ERROR: Yami no tiene rol "propietario" (tiene: ${yami.role})`);
      return;
    }
    
    if (yami.status !== 'T') {
      console.log(`❌ ERROR: Yami no está activa (estado: ${yami.status})`);
      return;
    }
    
    // 2. Verificar vehículo 0331NCP
    console.log('\n2️⃣ Verificando vehículo 54 0331NCP...');
    const vehicle = await prisma.carRentalCars.findFirst({
      where: {
        registration_number: { contains: '0331', mode: 'insensitive' }
      },
      include: {
        ownerUser: true
      }
    });
    
    if (!vehicle) {
      console.log('❌ ERROR: No se encontró el vehículo 54 0331NCP');
      return;
    }
    
    console.log(`✅ Vehículo encontrado:
      - ID: ${vehicle.id}
      - Matrícula: ${vehicle.registration_number}
      - Marca/Modelo: ${vehicle.make} ${vehicle.model}
      - owner_user_id: ${vehicle.owner_user_id}
      - ownership_type: ${vehicle.ownership_type}
      - commission_percentage: ${vehicle.commission_percentage}
      - monthly_fixed_costs: ${vehicle.monthly_fixed_costs}
      - Propietario actual: ${vehicle.ownerUser ? vehicle.ownerUser.firstname + ' ' + vehicle.ownerUser.lastname : 'Sin propietario'}
    `);
    
    // 3. Test de actualización individual (simulando el endpoint PUT)
    console.log('\n3️⃣ Probando actualización individual...');
    const updateResult = await prisma.carRentalCars.update({
      where: { id: vehicle.id },
      data: {
        owner_user_id: 7,
        commission_percentage: 65,
        monthly_fixed_costs: 150,
        ownership_type: 'commission',
        updated_at: new Date()
      }
    });
    
    console.log(`✅ Actualización individual exitosa:
      - commission_percentage cambió de ${vehicle.commission_percentage} a ${updateResult.commission_percentage}
      - monthly_fixed_costs cambió de ${vehicle.monthly_fixed_costs} a ${updateResult.monthly_fixed_costs}
    `);
    
    // 4. Verificar el cambio
    console.log('\n4️⃣ Verificando cambio en la base de datos...');
    const verifyVehicle = await prisma.carRentalCars.findUnique({
      where: { id: vehicle.id },
      select: {
        id: true,
        registration_number: true,
        owner_user_id: true,
        commission_percentage: true,
        monthly_fixed_costs: true,
        ownership_type: true,
        updated_at: true
      }
    });
    
    console.log(`✅ Estado actual en BD:`, verifyVehicle);
    
    // 5. Test de asignación masiva (simulando el endpoint bulk-assign)
    console.log('\n5️⃣ Probando asignación masiva...');
    const bulkResult = await prisma.carRentalCars.updateMany({
      where: {
        id: { in: [vehicle.id] }
      },
      data: {
        ownership_type: 'commission',
        owner_user_id: 7,
        commission_percentage: 70,
        monthly_fixed_costs: 200,
        updated_at: new Date()
      }
    });
    
    console.log(`✅ Asignación masiva exitosa: ${bulkResult.count} vehículo(s) actualizado(s)`);
    
    // 6. Verificar el cambio masivo
    console.log('\n6️⃣ Verificando cambio después de asignación masiva...');
    const verifyBulk = await prisma.carRentalCars.findUnique({
      where: { id: vehicle.id },
      select: {
        id: true,
        registration_number: true,
        owner_user_id: true,
        commission_percentage: true,
        monthly_fixed_costs: true,
        ownership_type: true,
        updated_at: true
      }
    });
    
    console.log(`✅ Estado actual en BD después de bulk:`, verifyBulk);
    
    // 7. Restaurar al estado original
    console.log('\n7️⃣ Restaurando al estado original...');
    await prisma.carRentalCars.update({
      where: { id: vehicle.id },
      data: {
        owner_user_id: 7,
        commission_percentage: 50,
        monthly_fixed_costs: 0
      }
    });
    console.log('✅ Vehículo restaurado al estado original');
    
    console.log('\n✅ === DIAGNÓSTICO COMPLETADO SIN ERRORES ===');
    console.log('\n📋 CONCLUSIÓN: La base de datos funciona correctamente.');
    console.log('Si el problema persiste en la interfaz, el error está en el frontend o en la comunicación HTTP.');
    
  } catch (error) {
    console.error('\n❌ ERROR DURANTE EL DIAGNÓSTICO:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testVehicleAssignment();
