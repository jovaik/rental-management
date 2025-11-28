require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteContracts() {
  // Delete contracts for reservations 121, 124, 126
  const bookingIds = [121, 124, 126];
  
  for (const id of bookingIds) {
    const contract = await prisma.carRentalContracts.findUnique({
      where: { booking_id: id },
      select: { id: true, signed_at: true, booking_id: true }
    });
    
    if (contract) {
      console.log(`Reserva ${id}: Contrato encontrado (ID: ${contract.id}), Firmado: ${contract.signed_at ? 'SÍ' : 'NO'}`);
      
      // Only delete if not signed
      if (!contract.signed_at) {
        await prisma.carRentalContracts.delete({
          where: { id: contract.id }
        });
        console.log(`✅ Contrato ${contract.id} eliminado (se regenerará automáticamente)`);
      } else {
        console.log(`⚠️  Contrato ${contract.id} está FIRMADO, NO se elimina`);
      }
    } else {
      console.log(`Reserva ${id}: Sin contrato`);
    }
    console.log('---');
  }
  
  await prisma.$disconnect();
}

deleteContracts().catch(console.error);
