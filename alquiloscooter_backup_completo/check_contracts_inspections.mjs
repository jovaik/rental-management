import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDocsAndInspections() {
  try {
    // Buscar reservas recientes
    const bookings = await prisma.carRentalBookings.findMany({
      take: 10,
      orderBy: { id: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            driver_license_front: true,
            id_document_front: true
          }
        },
        contracts: {
          select: {
            id: true,
            contract_number: true,
            pdf_generated: true
          }
        },
        inspections: {
          select: {
            id: true,
            inspection_type: true,
            front_photo: true,
            left_photo: true,
            rear_photo: true,
            right_photo: true
          }
        }
      }
    });
    
    console.log('📊 ANÁLISIS COMPLETO DE DOCUMENTOS\n');
    console.log('═'.repeat(80));
    
    for (const booking of bookings) {
      console.log(`\n📁 Reserva: ${booking.booking_number || 'RES-' + booking.id}`);
      console.log(`   Cliente: ${booking.customer?.first_name} ${booking.customer?.last_name}`);
      console.log(`   Estado: ${booking.status}`);
      
      // Documentos del cliente
      const hasCustomerDocs = booking.customer?.driver_license_front || booking.customer?.id_document_front;
      console.log(`   👤 Docs Cliente: ${hasCustomerDocs ? '✅ SÍ' : '❌ NO'}`);
      
      // Contratos
      if (booking.contracts && booking.contracts.length > 0) {
        console.log(`   📄 Contratos: ✅ ${booking.contracts.length}`);
        booking.contracts.forEach(c => {
          console.log(`      - ${c.contract_number} (PDF: ${c.pdf_generated ? 'SÍ' : 'NO'})`);
        });
      } else {
        console.log(`   📄 Contratos: ❌ NO GENERADOS`);
      }
      
      // Inspecciones
      if (booking.inspections && booking.inspections.length > 0) {
        console.log(`   🔍 Inspecciones: ✅ ${booking.inspections.length}`);
        booking.inspections.forEach(insp => {
          const photoCount = [insp.front_photo, insp.left_photo, insp.rear_photo, insp.right_photo]
            .filter(Boolean).length;
          console.log(`      - ${insp.inspection_type} (${photoCount} fotos)`);
        });
      } else {
        console.log(`   🔍 Inspecciones: ❌ NO REALIZADAS`);
      }
      
      // Resumen
      const shouldHaveDocs = hasCustomerDocs || 
                             (booking.contracts && booking.contracts.length > 0) || 
                             (booking.inspections && booking.inspections.length > 0);
      
      if (shouldHaveDocs) {
        console.log(`   ⚠️  DEBERÍA TENER ARCHIVOS EN GOOGLE DRIVE`);
      } else {
        console.log(`   ℹ️  Sin documentos para copiar (normal si la reserva es nueva)`);
      }
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n💡 RESUMEN:');
    console.log('   - Las carpetas solo tendrán archivos si:');
    console.log('     1. El cliente tiene documentos subidos (DNI, carnet)');
    console.log('     2. Se ha generado un contrato');
    console.log('     3. Se ha realizado una inspección');
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

checkDocsAndInspections();
