import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const vehicle = await prisma.carRentalCars.findFirst({
    where: {
      registration_number: {
        contains: '7421NGT',
        mode: 'insensitive'
      }
    }
  });
  
  console.log('✅ Vehículo encontrado:');
  console.log('ID:', vehicle?.id);
  console.log('Matrícula:', vehicle?.registration_number);
  console.log('Marca/Modelo:', vehicle?.make, vehicle?.model);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
