import { prisma } from './lib/db';

async function deleteContract() {
  console.log('🗑️  Eliminando contrato de reserva #126...');
  
  await prisma.carRentalContracts.deleteMany({
    where: { booking_id: 126 }
  });
  
  console.log('✅ Contrato eliminado');
  console.log('\n📋 Ahora puedes regenerarlo desde la app');
}

deleteContract()
  .catch(console.error)
  .finally(() => process.exit(0));
