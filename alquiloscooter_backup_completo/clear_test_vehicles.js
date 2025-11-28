require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n=== ELIMINANDO VEHÍCULOS DE PRUEBA ===\n');
  
  const result = await prisma.carRentalCars.deleteMany({
    where: {
      registration_number: 'TEST1234'
    }
  });
  
  console.log(`✅ Eliminados ${result.count} vehículos de prueba\n`);
  
  const remaining = await prisma.carRentalCars.count();
  console.log(`Total de vehículos restantes: ${remaining}\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
