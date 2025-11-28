const { PrismaClient } = require('@prisma/client');
require('dotenv/config');

const prisma = new PrismaClient();

async function main() {
  const groups = await prisma.carRentalPricingGroups.findMany({
    orderBy: { id: 'asc' }
  });
  
  console.log('Grupos tarifarios en la BD:');
  groups.forEach(g => {
    console.log(`ID: ${g.id}, Nombre: "${g.name}"`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
