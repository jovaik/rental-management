import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const prisma = new PrismaClient();

async function deleteBooking123() {
  console.log('🗑️  Eliminando reserva #123...\n');
  
  try {
    // Primero verificar que existe
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id: 123 }
    });
    
    if (!booking) {
      console.log('❌ Reserva #123 no encontrada');
      return;
    }
    
    console.log('📋 Reserva encontrada:');
    console.log('   Cliente:', booking.customer_name);
    console.log('   Fechas:', booking.pickup_date.toISOString().split('T')[0], '→', booking.return_date.toISOString().split('T')[0]);
    console.log('   Status:', booking.status);
    
    console.log('\n🗑️  Eliminando datos relacionados...');
    
    // Eliminar relaciones en orden
    
    // 1. Conductores adicionales
    const driversDeleted = await prisma.bookingDrivers.deleteMany({
      where: { booking_id: 123 }
    });
    console.log(`   ✅ ${driversDeleted.count} conductores eliminados`);
    
    // 2. Vehículos adicionales
    const vehiclesDeleted = await prisma.bookingVehicles.deleteMany({
      where: { booking_id: 123 }
    });
    console.log(`   ✅ ${vehiclesDeleted.count} vehículos adicionales eliminados`);
    
    // 3. Extras
    const extrasDeleted = await prisma.bookingExtras.deleteMany({
      where: { booking_id: 123 }
    });
    console.log(`   ✅ ${extrasDeleted.count} extras eliminados`);
    
    // 4. Upgrades
    const upgradesDeleted = await prisma.bookingUpgrades.deleteMany({
      where: { booking_id: 123 }
    });
    console.log(`   ✅ ${upgradesDeleted.count} upgrades eliminados`);
    
    // 5. Inspecciones
    const inspectionsDeleted = await prisma.vehicleInspections.deleteMany({
      where: { booking_id: 123 }
    });
    console.log(`   ✅ ${inspectionsDeleted.count} inspecciones eliminadas`);
    
    // 6. Contrato
    const contractsDeleted = await prisma.carRentalContracts.deleteMany({
      where: { booking_id: 123 }
    });
    console.log(`   ✅ ${contractsDeleted.count} contratos eliminados`);
    
    // 7. Pagos
    const paymentsDeleted = await prisma.bookingPayments.deleteMany({
      where: { booking_id: 123 }
    });
    console.log(`   ✅ ${paymentsDeleted.count} pagos eliminados`);
    
    // 8. Depósitos
    const depositDeleted = await prisma.bookingDeposits.deleteMany({
      where: { booking_id: 123 }
    });
    console.log(`   ✅ ${depositDeleted.count} depósitos eliminados`);
    
    // 9. Finalmente, la reserva
    await prisma.carRentalBookings.delete({
      where: { id: 123 }
    });
    console.log('   ✅ Reserva #123 eliminada');
    
    console.log('\n✅ ¡Reserva #123 y todos sus datos relacionados eliminados correctamente!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deleteBooking123();
