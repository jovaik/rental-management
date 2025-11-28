import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    const config = await prisma.companyConfig.findFirst({
      where: { active: true }
    });
    console.log('=== Configuración de la Empresa ===');
    console.log(JSON.stringify(config, null, 2));
    
    // También vamos a ver todos los contratos recientes
    const contracts = await prisma.carRentalContracts.findMany({
      take: 3,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        contract_number: true,
        created_at: true
      }
    });
    console.log('\n=== Últimos 3 Contratos ===');
    console.log(JSON.stringify(contracts, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
