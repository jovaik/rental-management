const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkLocations() {
  try {
    console.log('Verificando ubicaciones en la base de datos...\n');
    
    const allLocations = await prisma.businessLocations.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        active: true,
        is_public_pickup_point: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    console.log('TODAS LAS UBICACIONES:');
    console.table(allLocations);
    
    console.log('\n\nUBICACIONES PÚBLICAS (is_public_pickup_point = true):');
    const publicLocations = allLocations.filter(loc => loc.is_public_pickup_point);
    console.table(publicLocations);
    
    console.log('\n\nUBICACIONES NO PÚBLICAS (is_public_pickup_point = false):');
    const privateLocations = allLocations.filter(loc => !loc.is_public_pickup_point);
    console.table(privateLocations);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLocations();
