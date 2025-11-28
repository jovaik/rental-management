import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkContracts() {
  try {
    // Buscar contratos de hoy
    const today = new Date('2025-11-06');
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const contracts = await prisma.contract.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        id: true,
        contractNumber: true,
        createdAt: true,
        bookingId: true
      }
    });
    
    console.log('Contratos del día 2025-11-06:');
    console.log(JSON.stringify(contracts, null, 2));
    console.log('\nTotal contratos hoy:', contracts.length);
    
    // Ver el último contrato general
    const lastContract = await prisma.contract.findFirst({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        contractNumber: true,
        createdAt: true
      }
    });
    
    console.log('\nÚltimo contrato en general:');
    console.log(JSON.stringify(lastContract, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkContracts();
