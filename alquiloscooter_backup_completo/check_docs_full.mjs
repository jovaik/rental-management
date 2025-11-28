import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDocsAndInspections() {
  try {
    const bookings = await prisma.carRentalBookings.findMany({
      take: 10,
      orderBy: { id: 'desc' },
      include: {
        customer: true,
        contract: true,
        inspections: true
      }
    });
    
    console.log('📊 ANÁLISIS COMPLETO DE DOCUMENTOS\n');
    console.log('═'.repeat(80));
    
    for (const booking of bookings) {
      console.log(`\n📁 ${booking.booking_number || 'RES-' + booking.id}`);
      console.log(`   Cliente: ${booking.customer?.first_name} ${booking.customer?.last_name}`);
      console.log(`   Estado: ${booking.status}`);
      
      // Documentos del cliente
      const hasCustomerDocs = booking.customer?.driver_license_front || booking.customer?.id_document_front;
      console.log(`   👤 Docs Cliente: ${hasCustomerDocs ? '✅ SÍ' : '❌ NO'}`);
      
      // Contrato
      if (booking.contract) {
        console.log(`   📄 Contrato: ✅ ${booking.contract.contract_number} (PDF: ${booking.contract.pdf_generated ? 'SÍ' : 'NO'})`);
      } else {
        console.log(`   📄 Contrato: ❌ NO GENERADO`);
      }
      
      // Inspecciones
      if (booking.inspections && booking.inspections.length > 0) {
        console.log(`   🔍 Inspecciones: ✅ ${booking.inspections.length}`);
        for (const insp of booking.inspections) {
          const photoCount = [insp.front_photo, insp.left_photo, insp.rear_photo, insp.right_photo]
            .filter(Boolean).length;
          console.log(`      - ${insp.inspection_type} (${photoCount} fotos)`);
        }
      } else {
        console.log(`   🔍 Inspecciones: ❌ NO REALIZADAS`);
      }
      
      // URL de Google Drive
      if (booking.google_drive_folder_url) {
        console.log(`   🔗 Drive: ${booking.google_drive_folder_url}`);
      } else {
        console.log(`   🔗 Drive: ❌ NO SINCRONIZADO`);
      }
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n💡 CONCLUSIÓN:');
    console.log('   Las carpetas de Google Drive solo tendrán archivos cuando:');
    console.log('   1. El cliente suba documentos (DNI, carnet) → se copian automáticamente');
    console.log('   2. Se genere un contrato → se sube automáticamente');
    console.log('   3. Se haga una inspección → fotos y PDF se suben automáticamente');
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
  }
}

checkDocsAndInspections();
