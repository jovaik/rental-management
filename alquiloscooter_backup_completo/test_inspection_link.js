const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env' });

const prisma = new PrismaClient();

async function testInspectionLink() {
  try {
    console.log('🔍 Buscando una reserva con inspección...\n');
    
    // Buscar una reserva que tenga inspección de entrega
    const booking = await prisma.carRentalBookings.findFirst({
      where: {
        inspections: {
          some: {
            inspection_type: 'delivery'
          }
        }
      },
      include: {
        customer: true,
        inspections: {
          where: {
            inspection_type: 'delivery'
          },
          take: 1
        }
      }
    });

    if (!booking) {
      console.log('❌ No se encontró ninguna reserva con inspección de entrega');
      return;
    }

    console.log(`✅ Reserva encontrada: ${booking.booking_number}`);
    console.log(`   Cliente: ${booking.customer_name}`);
    console.log(`   Inspecciones: ${booking.inspections.length}`);
    
    // Buscar enlace de inspección existente
    const inspectionLink = await prisma.inspectionLink.findFirst({
      where: {
        booking_id: booking.id
      }
    });

    if (inspectionLink) {
      const baseUrl = process.env.NEXTAUTH_URL || 'https://app.alquiloscooter.com';
      const fullLink = `${baseUrl}/inspeccion/${inspectionLink.token}`;
      
      console.log('\n✅ ENLACE DE INSPECCIÓN ENCONTRADO:');
      console.log(`   ${fullLink}`);
      console.log(`   Expira: ${inspectionLink.expires_at.toLocaleDateString('es-ES')}`);
      console.log(`   Token: ${inspectionLink.token.substring(0, 20)}...`);
    } else {
      console.log('\n⚠️  No hay enlace de inspección para esta reserva');
      console.log('   Se generará automáticamente al regenerar el contrato');
    }

    // Verificar el contrato
    const contract = await prisma.carRentalContracts.findUnique({
      where: {
        booking_id: booking.id
      }
    });

    if (contract) {
      console.log(`\n📄 Contrato: ${contract.contract_number}`);
      console.log(`   Firmado: ${contract.signed_at ? 'Sí' : 'No'}`);
      
      // Buscar el enlace en el HTML del contrato
      if (contract.contract_html && contract.contract_html.includes('inspeccion/')) {
        console.log('   ✅ El contrato CONTIENE el enlace de inspección');
        
        // Extraer el enlace del HTML
        const match = contract.contract_html.match(/https:\/\/[^"]+\/inspeccion\/[a-f0-9]+/);
        if (match) {
          console.log(`   Enlace en contrato: ${match[0]}`);
        }
      } else {
        console.log('   ❌ El contrato NO contiene el enlace de inspección');
        console.log('   → Necesita regenerarse');
      }
    } else {
      console.log('\n⚠️  No hay contrato generado para esta reserva');
    }

    console.log('\n' + '='.repeat(80));
    console.log('UBICACIÓN DEL ENLACE EN EL CONTRATO:');
    console.log('='.repeat(80));
    console.log('El enlace aparece AL FINAL del contrato PDF, después de:');
    console.log('  1. Datos del cliente');
    console.log('  2. Vehículos alquilados');
    console.log('  3. Condiciones generales');
    console.log('  4. Firma');
    console.log('  5. Footer');
    console.log('  6. → AQUÍ: Sección "Fotografías de Inspección" (fondo gris, borde naranja)');
    console.log('\nTexto que verás:');
    console.log('  "Las fotografías de la inspección de su vehículo están disponibles en línea."');
    console.log('  "Puede verlas visitando el siguiente enlace:"');
    console.log('  [ENLACE CLICKEABLE]');
    console.log('  "Este enlace es válido durante 30 días desde la fecha del contrato."');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testInspectionLink();
