const { PrismaClient } = require('@prisma/client');
require('dotenv/config');

const prisma = new PrismaClient();

async function revertMigration() {
  try {
    console.log('\n🔄 REVIRTIENDO MIGRACIÓN AUTOMÁTICA\n');
    
    // Limpiar TODOS los vehículos que fueron marcados automáticamente
    const result = await prisma.carRentalCars.updateMany({
      where: {
        archived_status: {
          not: null
        }
      },
      data: {
        archived_status: null,
        archived_date: null,
        archived_reason: null,
        buyer_name: null,
        sale_amount: null
      }
    });
    
    console.log(`✅ Limpiados ${result.count} vehículos`);
    console.log('✅ Todos los vehículos vuelven a estar activos en el listado\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

revertMigration();
