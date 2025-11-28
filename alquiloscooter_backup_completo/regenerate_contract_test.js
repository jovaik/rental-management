const { PrismaClient } = require('@prisma/client');
const { regenerateContractIfNotSigned } = require('./lib/contract-regeneration');
require('dotenv').config({ path: '.env' });

const prisma = new PrismaClient();

async function regenerateAndTest() {
  try {
    console.log('🔄 Regenerando contrato con enlace de inspección...\n');
    
    // Buscar la reserva con inspección
    const booking = await prisma.carRentalBookings.findFirst({
      where: {
        inspections: {
          some: {
            inspection_type: 'delivery'
          }
        }
      }
    });

    if (!booking) {
      console.log('❌ No se encontró reserva con inspección');
      return;
    }

    console.log(`📋 Reserva: ${booking.booking_number}`);
    console.log(`   ID: ${booking.id}`);
    
    // Regenerar el contrato
    console.log('\n⏳ Regenerando contrato...');
    const result = await regenerateContractIfNotSigned(
      booking.id,
      'Prueba de enlace de inspección',
      'system'
    );
    
    if (!result) {
      console.log('⚠️  El contrato no se regeneró (puede estar firmado)');
      return;
    }
    
    console.log('✅ Contrato regenerado exitosamente\n');
    
    // Verificar el enlace de inspección
    const inspectionLink = await prisma.inspectionLink.findFirst({
      where: {
        booking_id: booking.id
      }
    });

    if (inspectionLink) {
      const baseUrl = process.env.NEXTAUTH_URL || 'https://app.alquiloscooter.com';
      const fullLink = `${baseUrl}/inspeccion/${inspectionLink.token}`;
      
      console.log('✅ ENLACE DE INSPECCIÓN CREADO:');
      console.log(`   ${fullLink}`);
      console.log(`   Expira: ${inspectionLink.expires_at.toLocaleDateString('es-ES')}`);
    }

    // Verificar que el contrato contiene el enlace
    const contract = await prisma.carRentalContracts.findUnique({
      where: {
        booking_id: booking.id
      }
    });

    if (contract && contract.contract_html) {
      if (contract.contract_html.includes('inspeccion/')) {
        console.log('\n✅ EL CONTRATO AHORA CONTIENE EL ENLACE');
        
        const match = contract.contract_html.match(/https:\/\/[^"]+\/inspeccion\/[a-f0-9]+/);
        if (match) {
          console.log(`   Enlace en HTML: ${match[0]}`);
        }
        
        // Verificar el texto descriptivo
        if (contract.contract_html.includes('Fotografías de Inspección')) {
          console.log('   ✅ Sección "Fotografías de Inspección" presente');
        }
        if (contract.contract_html.includes('Puede verlas visitando')) {
          console.log('   ✅ Texto descriptivo presente');
        }
        if (contract.contract_html.includes('válido durante 30 días')) {
          console.log('   ✅ Texto de expiración presente');
        }
      } else {
        console.log('\n❌ ERROR: El contrato NO contiene el enlace');
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📍 UBICACIÓN DEL ENLACE EN EL PDF:');
    console.log('='.repeat(80));
    console.log('El enlace aparece en la ÚLTIMA PÁGINA del contrato,');
    console.log('después de la firma y el footer, en una caja destacada con:');
    console.log('  • Fondo gris claro (#f8fafc)');
    console.log('  • Borde naranja (color corporativo)');
    console.log('  • Título: "Fotografías de Inspección"');
    console.log('  • Enlace clickeable');
    console.log('  • Texto de validez: "Este enlace es válido durante 30 días"');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

regenerateAndTest();
