const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFirstContract() {
  try {
    const contract = await prisma.carRentalContracts.findUnique({
      where: {
        id: 40
      },
      include: {
        booking: {
          select: {
            id: true,
            booking_number: true,
            pickup_date: true,
            return_date: true,
            status: true,
            customer: {
              select: {
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        }
      }
    });
    
    console.log('=== CONTRATO 202511060001 (ID 40) ===');
    console.log('Número de contrato:', contract.contract_number);
    console.log('Creado:', contract.created_at);
    console.log('Firmado:', contract.signed_at || 'NO FIRMADO');
    console.log('\nReserva asociada:');
    console.log('  ID:', contract.booking.id);
    console.log('  Número:', contract.booking.booking_number);
    console.log('  Cliente:', contract.booking.customer.first_name, contract.booking.customer.last_name);
    console.log('  Email:', contract.booking.customer.email);
    console.log('  Recogida:', contract.booking.pickup_date);
    console.log('  Devolución:', contract.booking.return_date);
    console.log('  Estado:', contract.booking.status);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkFirstContract();
