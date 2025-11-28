const { PrismaClient } = require('@prisma/client');
require('dotenv/config');

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.carRentalGastos.findMany({
    select: { categoria: true },
    distinct: ['categoria'],
    orderBy: { categoria: 'asc' }
  });
  
  console.log('Categorías de gastos únicas en la BD:');
  categories.forEach(c => {
    console.log(`- "${c.categoria}"`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
