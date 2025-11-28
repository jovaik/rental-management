const { PrismaClient } = require('@prisma/client');
require('dotenv/config');

const prisma = new PrismaClient();

async function migrateArchivedVehicles() {
  try {
    console.log('\n🔄 INICIANDO MIGRACIÓN DE VEHÍCULOS ARCHIVADOS\n');
    
    // Buscar vehículos vendidos (contienen "VENDID" en matrícula)
    const soldVehicles = await prisma.carRentalCars.findMany({
      where: {
        registration_number: {
          contains: 'VENDID',
          mode: 'insensitive'
        },
        archived_status: null
      }
    });
    
    console.log(`📊 Encontrados ${soldVehicles.length} vehículos VENDIDOS para migrar`);
    
    let soldCount = 0;
    for (const vehicle of soldVehicles) {
      await prisma.carRentalCars.update({
        where: { id: vehicle.id },
        data: {
          archived_status: 'vendido',
          archived_date: new Date('2024-01-01'), // Fecha genérica pasada
          archived_reason: 'Migración automática - Vehículo vendido',
          buyer_name: 'Comprador no registrado',
          sale_amount: 0
        }
      });
      soldCount++;
      console.log(`  ✅ ${vehicle.registration_number} → VENDIDO`);
    }
    
    // Buscar vehículos dados de baja (contienen "BAJA" o "DEPOSITO")
    const decommissionedVehicles = await prisma.carRentalCars.findMany({
      where: {
        OR: [
          {
            registration_number: {
              contains: 'BAJA',
              mode: 'insensitive'
            }
          },
          {
            registration_number: {
              contains: 'DEPOSITO',
              mode: 'insensitive'
            }
          }
        ],
        archived_status: null
      }
    });
    
    console.log(`\n📊 Encontrados ${decommissionedVehicles.length} vehículos DADOS DE BAJA para migrar`);
    
    let decommissionedCount = 0;
    for (const vehicle of decommissionedVehicles) {
      await prisma.carRentalCars.update({
        where: { id: vehicle.id },
        data: {
          archived_status: 'dado_de_baja',
          archived_date: new Date('2024-01-01'), // Fecha genérica pasada
          archived_reason: vehicle.registration_number.includes('DEPOSITO') 
            ? 'Depósito municipal - Migración automática'
            : 'Baja temporal - Migración automática'
        }
      });
      decommissionedCount++;
      console.log(`  ✅ ${vehicle.registration_number} → DADO DE BAJA`);
    }
    
    console.log(`\n✨ MIGRACIÓN COMPLETADA:`);
    console.log(`   🏷️  ${soldCount} vehículos marcados como VENDIDOS`);
    console.log(`   ⛔ ${decommissionedCount} vehículos marcados como DADOS DE BAJA`);
    console.log(`   📦 Total: ${soldCount + decommissionedCount} vehículos archivados\n`);
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateArchivedVehicles();
