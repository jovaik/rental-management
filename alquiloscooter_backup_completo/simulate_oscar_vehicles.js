const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = 10; // Oscar
  const userRole = 'taller';
  
  console.log('=== SIMULACIÓN: Vehículos visibles para OSCAR ===\n');
  
  // 1. Obtener ubicaciones del usuario
  const userLocations = await prisma.businessLocations.findMany({
    where: { 
      user_id: userId,
      active: true
    },
    select: { id: true, name: true }
  });
  const businessLocationIds = userLocations.map(loc => loc.id);
  
  console.log('1. Ubicaciones de Oscar:', userLocations);
  console.log('   IDs:', businessLocationIds);
  
  // 2. Obtener vehículos con el filtro de rol "taller"
  const whereClause = {
    current_business_location_id: {
      in: businessLocationIds
    }
  };
  
  console.log('\n2. Filtro aplicado:', JSON.stringify(whereClause, null, 2));
  
  const vehicles = await prisma.carRentalCars.findMany({
    where: whereClause,
    select: {
      id: true,
      registration_number: true,
      make: true,
      model: true,
      status: true,
      current_business_location_id: true
    },
    orderBy: { registration_number: 'asc' }
  });
  
  console.log(`\n3. Vehículos encontrados: ${vehicles.length}`);
  vehicles.forEach((v, i) => {
    console.log(`   ${i+1}. ${v.registration_number} - ${v.make} ${v.model} (status: ${v.status})`);
  });
  
  // 4. Buscar específicamente el N 39
  const n39 = vehicles.find(v => v.registration_number.includes('N 39'));
  console.log(`\n4. ¿Está N 39 en la lista? ${n39 ? '✅ SÍ' : '❌ NO'}`);
  if (n39) {
    console.log('   Detalles:', n39);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
