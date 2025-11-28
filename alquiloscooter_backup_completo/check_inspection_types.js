require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTypes() {
  try {
    const inspections = await prisma.vehicleInspections.findMany({
      select: {
        id: true,
        inspection_type: true,
        booking_id: true
      },
      orderBy: { id: 'desc' },
      take: 10
    });

    console.log('\n🔍 Últimas 10 inspecciones:');
    inspections.forEach(i => {
      console.log(`  ID ${i.id}: tipo="${i.inspection_type}", booking=${i.booking_id}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTypes();
