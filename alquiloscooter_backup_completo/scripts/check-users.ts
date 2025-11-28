
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.carRentalUsers.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true
      }
    });
    
    console.log('Usuarios existentes:');
    console.log(JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
