const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkContracts() {
  try {
    // Buscar todos los contratos que empiecen con 20251106
    const contracts = await prisma.carRentalContracts.findMany({
      where: {
        contract_number: {
          startsWith: '20251106'
        }
      },
      orderBy: {
        contract_number: 'asc'
      },
      select: {
        id: true,
        booking_id: true,
        contract_number: true,
        created_at: true,
        signed_at: true
      }
    });
    
    console.log('=== CONTRATOS DEL 06 DE NOVIEMBRE DE 2025 ===');
    console.log(JSON.stringify(contracts, null, 2));
    console.log('\nTotal:', contracts.length);
    
    // Buscar reservas del día
    const bookings = await prisma.carRentalBookings.findMany({
      where: {
        booking_number: {
          startsWith: '20251106'
        }
      },
      orderBy: {
        booking_number: 'asc'
      },
      select: {
        id: true,
        booking_number: true,
        start_date: true,
        created_at: true
      }
    });
    
    console.log('\n=== RESERVAS DEL 06 DE NOVIEMBRE DE 2025 ===');
    console.log(JSON.stringify(bookings, null, 2));
    console.log('\nTotal:', bookings.length);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkContracts();
