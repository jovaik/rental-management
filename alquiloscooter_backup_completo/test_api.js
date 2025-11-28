// Test the vehicles API endpoint
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testVehicles() {
  try {
    console.log('Checking vehicles in database...\n');
    
    const vehicles = await prisma.carRentalCars.findMany({
      select: {
        id: true,
        registration_number: true,
        make: true,
        model: true,
        year: true,
        status: true,
        pricing_group_id: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' }
    });
    
    console.log(`Total vehicles: ${vehicles.length}\n`);
    
    if (vehicles.length > 0) {
      console.log('Vehicles list:');
      vehicles.forEach((v, index) => {
        console.log(`\n${index + 1}. ID: ${v.id}`);
        console.log(`   Make/Model: ${v.make || 'N/A'} ${v.model || 'N/A'} (${v.year || 'N/A'})`);
        console.log(`   Registration: ${v.registration_number || 'N/A'}`);
        console.log(`   Status: ${v.status}`);
        console.log(`   Pricing Group: ${v.pricing_group_id || 'Not assigned'}`);
        console.log(`   Created: ${v.created_at}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testVehicles();
