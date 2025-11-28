const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('=== VEHÍCULOS EN LA BASE DE DATOS ===');
    const vehicles = await prisma.carRentalCars.findMany({
      select: {
        id: true,
        registration_number: true,
        make: true,
        model: true,
        status: true
      },
      orderBy: { id: 'asc' }
    });
    
    console.log(`Total vehículos: ${vehicles.length}`);
    vehicles.forEach(v => {
      console.log(`ID: ${v.id} | Matrícula: ${v.registration_number} | ${v.make} ${v.model} | Status: ${v.status}`);
    });
    
    console.log('\n=== RESERVAS ACTIVAS (confirmed/pending) ===');
    const now = new Date();
    const activeBookings = await prisma.carRentalBookings.findMany({
      where: {
        status: { in: ['confirmed', 'pending'] },
        return_date: { gte: now }
      },
      include: {
        vehicles: {
          include: {
            vehicle: {
              select: {
                id: true,
                registration_number: true,
                make: true,
                model: true
              }
            }
          }
        }
      },
      orderBy: { pickup_date: 'asc' }
    });
    
    console.log(`Total reservas activas: ${activeBookings.length}`);
    activeBookings.forEach(b => {
      console.log(`\nReserva #${b.booking_number} (${b.status})`);
      console.log(`  Fechas: ${b.pickup_date?.toISOString().split('T')[0]} → ${b.return_date?.toISOString().split('T')[0]}`);
      console.log(`  Vehículos:`);
      b.vehicles.forEach(bv => {
        console.log(`    - ID ${bv.vehicle.id}: ${bv.vehicle.registration_number} (${bv.vehicle.make} ${bv.vehicle.model})`);
      });
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
