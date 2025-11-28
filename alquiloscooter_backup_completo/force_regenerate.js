const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env' });

const prisma = new PrismaClient();

async function forceRegenerate() {
  try {
    console.log('🔄 Forzando regeneración de contrato...\n');
    
    // Buscar reserva con inspección
    const booking = await prisma.carRentalBookings.findFirst({
      where: {
        inspections: {
          some: {
            inspection_type: 'delivery'
          }
        },
        contract: {
          signed_at: null // Solo contratos no firmados
        }
      },
      include: {
        contract: true
      }
    });

    if (!booking) {
      console.log('❌ No se encontró reserva sin firmar con inspección');
      return;
    }

    console.log(`📋 Reserva: ${booking.booking_number}`);
    
    if (booking.contract) {
      // Borrar el contrato para forzar regeneración
      console.log('🗑️  Borrando contrato antiguo para regenerar...');
      await prisma.carRentalContracts.delete({
        where: { id: booking.contract.id }
      });
      console.log('✅ Contrato borrado');
    }
    
    console.log('\n✅ Listo! Ahora cuando accedas a:');
    console.log(`   https://app.alquiloscooter.com/planning`);
    console.log(`   Y descargues el contrato de la reserva ${booking.booking_number}`);
    console.log(`   Se generará automáticamente CON el enlace de inspección`);
    
    console.log('\n📍 El enlace aparecerá en la ÚLTIMA PÁGINA del PDF');
    console.log('   después de la firma, en una sección destacada naranja');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceRegenerate();
