require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    // Verificar vehículos con ownership_type = commission
    const vehiclesCommission = await prisma.carRentalCars.findMany({
      where: {
        ownership_type: 'commission',
        status: 'T'
      },
      select: {
        id: true,
        registration_number: true,
        owner_user_id: true,
        owner_name: true,
        ownership_type: true
      }
    });
    
    console.log('\n========== VEHÍCULOS EN COMISIÓN ==========');
    console.log('Total:', vehiclesCommission.length);
    vehiclesCommission.slice(0, 5).forEach(v => {
      console.log(`- ${v.registration_number} | Owner ID: ${v.owner_user_id} | ${v.owner_name}`);
    });
    
    // Verificar TODOS los vehículos con propietario
    const vehiclesWithOwner = await prisma.carRentalCars.findMany({
      where: {
        owner_user_id: { not: null },
        status: 'T'
      },
      select: {
        id: true,
        registration_number: true,
        owner_user_id: true,
        ownership_type: true
      }
    });
    
    console.log('\n========== VEHÍCULOS CON PROPIETARIO ==========');
    console.log('Total:', vehiclesWithOwner.length);
    
    // Contar por ownership_type
    const byType = {};
    vehiclesWithOwner.forEach(v => {
      const type = v.ownership_type || 'null';
      byType[type] = (byType[type] || 0) + 1;
    });
    
    console.log('\nPor tipo de propiedad:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`- ${type}: ${count}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
