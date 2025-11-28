import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/ubuntu/rental_management_app/app/.env' });
const prisma = new PrismaClient();

async function checkMissingDocs() {
  try {
    console.log('📊 ANÁLISIS DE DOCUMENTOS FALTANTES\n');
    console.log('═'.repeat(80));
    
    // Obtener reservas específicas
    const bookings = await prisma.carRentalBookings.findMany({
      where: {
        booking_number: { in: ['202510260001', '202510240001'] }
      },
      include: {
        customer: true,
        contract: true,
        inspections: { orderBy: { id: 'asc' } }
      }
    });
    
    for (const booking of bookings) {
      console.log(`\n📁 ${booking.booking_number}`);
      console.log(`   URL Drive: ${booking.google_drive_folder_url}\n`);
      
      // Documentos del cliente
      console.log('   👤 DOCUMENTOS DEL CLIENTE:');
      if (booking.customer) {
        console.log(`      - Carnet frontal: ${booking.customer.driver_license_front ? '✅' : '❌'}`);
        console.log(`      - Carnet trasero: ${booking.customer.driver_license_back ? '✅' : '❌'}`);
        console.log(`      - DNI frontal: ${booking.customer.id_document_front ? '✅' : '❌'}`);
        console.log(`      - DNI trasero: ${booking.customer.id_document_back ? '✅' : '❌'}`);
      } else {
        console.log('      ❌ Sin cliente asociado');
      }
      
      // Contrato
      console.log('\n   📄 CONTRATO:');
      if (booking.contract?.pdf_path) {
        console.log(`      ✅ Contrato PDF: ${booking.contract.pdf_path}`);
      } else {
        console.log('      ❌ Sin contrato PDF');
      }
      
      // Inspecciones
      console.log(`\n   🔍 INSPECCIONES: ${booking.inspections?.length || 0} registradas`);
      if (booking.inspections?.length > 0) {
        for (const [index, insp] of booking.inspections.entries()) {
          const type = insp.inspection_type === 'return' ? 'SALIDA' : 'ENTRADA';
          console.log(`\n      ${index + 1}. Inspección ${type} (ID: ${insp.id})`);
          console.log(`         - Frontal: ${insp.front_photo ? '✅' : '❌'}`);
          console.log(`         - Izquierda: ${insp.left_photo ? '✅' : '❌'}`);
          console.log(`         - Trasera: ${insp.rear_photo ? '✅' : '❌'}`);
          console.log(`         - Derecha: ${insp.right_photo ? '✅' : '❌'}`);
          console.log(`         - Odómetro: ${insp.odometer_photo ? '✅' : '❌'}`);
          const total = [insp.front_photo, insp.left_photo, insp.rear_photo, insp.right_photo, insp.odometer_photo].filter(x => x).length;
          console.log(`         Total fotos: ${total}/5`);
        }
      }
      
      console.log('\n   📊 RESUMEN:');
      const totalDocsCliente = [
        booking.customer?.driver_license_front,
        booking.customer?.driver_license_back,
        booking.customer?.id_document_front,
        booking.customer?.id_document_back
      ].filter(x => x).length;
      
      const totalFotosInspeccion = booking.inspections?.reduce((sum, insp) => {
        return sum + [insp.front_photo, insp.left_photo, insp.rear_photo, insp.right_photo, insp.odometer_photo].filter(x => x).length;
      }, 0) || 0;
      
      console.log(`      - Docs cliente: ${totalDocsCliente}/4`);
      console.log(`      - Contratos: ${booking.contract?.pdf_path ? '1/1' : '0/1'}`);
      console.log(`      - Fotos inspección: ${totalFotosInspeccion}/${(booking.inspections?.length || 0) * 5}`);
      console.log(`      - PDFs inspección: 0/${booking.inspections?.length || 0} (FALTAN GENERAR)`);
      
      const expectedTotal = totalDocsCliente + (booking.contract?.pdf_path ? 1 : 0) + totalFotosInspeccion + (booking.inspections?.length || 0);
      console.log(`\n      📊 Archivos esperados en Drive: ${expectedTotal}`);
      console.log(`         - ${totalDocsCliente} documentos cliente`);
      console.log(`         - ${booking.contract?.pdf_path ? 1 : 0} contrato PDF`);
      console.log(`         - ${totalFotosInspeccion} fotos inspección`);
      console.log(`         - ${booking.inspections?.length || 0} PDFs inspección (PENDIENTES)`);
    }
    
    console.log('\n' + '═'.repeat(80));
    await prisma.$disconnect();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkMissingDocs();
