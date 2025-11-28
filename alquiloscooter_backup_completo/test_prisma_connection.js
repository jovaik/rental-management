const { PrismaClient } = require('@prisma/client');

async function test() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing Prisma connection...');
    const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Booking"`;
    console.log('Connection successful!', result);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

test();
