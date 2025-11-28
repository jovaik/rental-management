const { PrismaClient } = require('@prisma/client');
require('dotenv/config');

const prisma = new PrismaClient();

async function checkArchivedVehicles() {
  try {
    console.log('\n=== VERIFICANDO VEHÍCULOS ARCHIVADOS ===\n');
    
    // Buscar vehículos que contengan palabras clave de archivo
    const keywords = ['VENDID', 'BAJA', 'DEPOSITO'];
    
    for (const keyword of keywords) {
      const vehicles = await prisma.carRentalCars.findMany({
        where: {
          registration_number: {
            contains: keyword,
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          registration_number: true,
          make: true,
          model: true,
          status: true,
          archived_status: true,
          archived_date: true,
          buyer_name: true,
          sale_amount: true,
          archived_reason: true
        }
      });
      
      if (vehicles.length > 0) {
        console.log(`\n🔍 Vehículos con "${keyword}" en matrícula (${vehicles.length}):`);
        vehicles.forEach(v => {
          console.log(`\nID: ${v.id}`);
          console.log(`  Matrícula: ${v.registration_number}`);
          console.log(`  Vehículo: ${v.make} ${v.model}`);
          console.log(`  Status: ${v.status}`);
          console.log(`  archived_status: ${v.archived_status || 'NULL'}`);
          console.log(`  archived_date: ${v.archived_date || 'NULL'}`);
          console.log(`  buyer_name: ${v.buyer_name || 'NULL'}`);
          console.log(`  sale_amount: ${v.sale_amount || 'NULL'}`);
        });
      }
    }
    
    console.log('\n\n=== TODOS LOS VEHÍCULOS CON archived_status NO NULL ===\n');
    const archivedVehicles = await prisma.carRentalCars.findMany({
      where: {
        archived_status: {
          not: null
        }
      },
      select: {
        id: true,
        registration_number: true,
        make: true,
        model: true,
        status: true,
        archived_status: true,
        archived_date: true,
        buyer_name: true
      }
    });
    
    if (archivedVehicles.length === 0) {
      console.log('❌ NO SE ENCONTRARON VEHÍCULOS CON archived_status NO NULL');
    } else {
      console.log(`✅ Se encontraron ${archivedVehicles.length} vehículos archivados:`);
      archivedVehicles.forEach(v => {
        console.log(`\n  - ${v.registration_number} (ID: ${v.id})`);
        console.log(`    ${v.make} ${v.model}`);
        console.log(`    archived_status: ${v.archived_status}`);
        console.log(`    archived_date: ${v.archived_date}`);
        console.log(`    buyer_name: ${v.buyer_name || 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkArchivedVehicles();
