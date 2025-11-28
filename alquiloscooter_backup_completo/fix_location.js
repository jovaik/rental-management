const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function fixLocation() {
  try {
    console.log('Actualizando Oficina Marbella como punto público de recogida...\n');
    
    const updated = await prisma.businessLocations.update({
      where: {
        id: 1  // OFICINA MARBELLA
      },
      data: {
        is_public_pickup_point: true
      }
    });
    
    console.log('✅ Oficina Marbella actualizada:');
    console.log(updated);
    
    console.log('\n\nVerificando ubicaciones públicas...');
    const publicLocations = await prisma.businessLocations.findMany({
      where: {
        is_public_pickup_point: true,
        active: true
      }
    });
    
    console.log('\nUBICACIONES PÚBLICAS:');
    console.table(publicLocations);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixLocation();
