const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBulkAssignAPI() {
  console.log('\n====== TEST DE ASIGNACIÓN MASIVA ======\n');
  
  try {
    // 1. Obtener propietario activo
    const owner = await prisma.carRentalUsers.findFirst({
      where: {
        role: 'propietario',
        status: 'T'
      }
    });
    
    if (!owner) {
      console.log('❌ No hay propietarios activos');
      return;
    }
    
    console.log(`✅ Propietario encontrado: ${owner.firstname} ${owner.lastname} (ID: ${owner.id})`);
    
    // 2. Obtener algunos vehículos
    const vehicles = await prisma.carRentalCars.findMany({
      where: {
        owner_user_id: null  // Solo vehículos sin asignar
      },
      select: {
        id: true,
        registration_number: true,
        make: true,
        model: true
      },
      take: 3
    });
    
    console.log(`✅ Vehículos sin asignar: ${vehicles.length}`);
    vehicles.forEach(v => {
      console.log(`   - ID: ${v.id}, ${v.registration_number} (${v.make} ${v.model})`);
    });
    
    if (vehicles.length === 0) {
      console.log('⚠️  No hay vehículos sin asignar. Usando todos los vehículos...');
      const allVehicles = await prisma.carRentalCars.findMany({
        select: { id: true, registration_number: true, make: true, model: true },
        take: 3
      });
      vehicles.push(...allVehicles);
    }
    
    // 3. Simular asignación masiva
    const vehicleIds = vehicles.map(v => v.id);
    
    console.log(`\n🔄 Simulando asignación masiva de ${vehicleIds.length} vehículos al propietario ${owner.id}...`);
    console.log(`   Vehicle IDs: ${JSON.stringify(vehicleIds)}`);
    console.log(`   Owner ID: ${owner.id}`);
    console.log(`   Commission: 20%`);
    
    const result = await prisma.carRentalCars.updateMany({
      where: {
        id: {
          in: vehicleIds
        }
      },
      data: {
        ownership_type: 'commission',
        owner_user_id: owner.id,
        commission_percentage: 20,
        monthly_fixed_costs: 0,
        updated_at: new Date()
      }
    });
    
    console.log(`\n✅ ASIGNACIÓN EXITOSA: ${result.count} vehículos actualizados`);
    
    // 4. Verificar los cambios
    const updatedVehicles = await prisma.carRentalCars.findMany({
      where: {
        id: {
          in: vehicleIds
        }
      },
      select: {
        id: true,
        registration_number: true,
        owner_user_id: true,
        commission_percentage: true,
        ownership_type: true
      }
    });
    
    console.log('\n📊 VEHÍCULOS ACTUALIZADOS:');
    updatedVehicles.forEach(v => {
      console.log(`   - ${v.registration_number}: Owner=${v.owner_user_id}, Commission=${v.commission_percentage}%, Type=${v.ownership_type}`);
    });
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testBulkAssignAPI();
