const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testOwnersAndVehicles() {
  console.log('\n====== DIAGNÓSTICO DE PROPIETARIOS Y VEHÍCULOS ======\n');
  
  try {
    // 1. Verificar propietarios activos
    console.log('1️⃣  VERIFICANDO PROPIETARIOS ACTIVOS...');
    const owners = await prisma.carRentalUsers.findMany({
      where: {
        role: 'propietario',
        status: 'T'
      },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        role: true,
        status: true
      }
    });
    
    console.log(`✅ Propietarios activos encontrados: ${owners.length}`);
    owners.forEach(owner => {
      console.log(`   - ID: ${owner.id}, Nombre: ${owner.firstname} ${owner.lastname}, Email: ${owner.email}`);
    });
    
    if (owners.length === 0) {
      console.log('❌ NO HAY PROPIETARIOS ACTIVOS - Este es el problema!');
      
      // Buscar todos los usuarios con role propietario (sin filtro de estado)
      const allOwners = await prisma.carRentalUsers.findMany({
        where: { role: 'propietario' }
      });
      console.log(`\n🔍 Total de usuarios con rol propietario (todos los estados): ${allOwners.length}`);
      allOwners.forEach(owner => {
        console.log(`   - ID: ${owner.id}, Nombre: ${owner.firstname} ${owner.lastname}, Estado: ${owner.status}`);
      });
    }
    
    // 2. Verificar vehículos
    console.log('\n2️⃣  VERIFICANDO VEHÍCULOS...');
    const vehicles = await prisma.carRentalCars.findMany({
      select: {
        id: true,
        registration_number: true,
        make: true,
        model: true,
        ownership_type: true,
        owner_user_id: true,
        owner_name: true
      },
      take: 5
    });
    
    console.log(`✅ Vehículos en BD: ${vehicles.length}`);
    vehicles.forEach(v => {
      console.log(`   - ID: ${v.id}, ${v.registration_number} (${v.make} ${v.model}), Owner ID: ${v.owner_user_id || 'Sin asignar'}`);
    });
    
    // 3. Test de asignación individual (simulado)
    if (owners.length > 0 && vehicles.length > 0) {
      console.log('\n3️⃣  SIMULANDO ASIGNACIÓN INDIVIDUAL...');
      const testOwner = owners[0];
      const testVehicle = vehicles[0];
      
      console.log(`Intentando asignar vehículo ${testVehicle.id} al propietario ${testOwner.id}...`);
      
      try {
        const updated = await prisma.carRentalCars.update({
          where: { id: testVehicle.id },
          data: {
            ownership_type: 'commission',
            owner_user_id: testOwner.id,
            commission_percentage: 20,
            monthly_fixed_costs: 0,
            updated_at: new Date()
          }
        });
        console.log('✅ Asignación individual exitosa!');
        console.log(`   Vehículo ${updated.id} asignado a propietario ${updated.owner_user_id}`);
      } catch (error) {
        console.log('❌ Error en asignación individual:', error.message);
      }
    }
    
    // 4. Verificar el endpoint de owners-depositors
    console.log('\n4️⃣  VERIFICANDO ENDPOINT /api/users/owners-depositors...');
    const allPropietarios = await prisma.carRentalUsers.findMany({
      where: { role: 'propietario' }
    });
    const allColaboradores = await prisma.carRentalUsers.findMany({
      where: { role: 'colaborador' }
    });
    console.log(`Total propietarios: ${allPropietarios.length}`);
    console.log(`Total colaboradores: ${allColaboradores.length}`);
    
  } catch (error) {
    console.error('❌ ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOwnersAndVehicles();
