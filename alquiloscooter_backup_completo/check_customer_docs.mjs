import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDocs() {
  try {
    // Buscar reservas recientes
    const bookings = await prisma.carRentalBookings.findMany({
      where: {
        booking_number: {
          in: ['202510210001', '202510230001', '202510230002']
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            driver_license_front: true,
            driver_license_back: true,
            id_document_front: true,
            id_document_back: true
          }
        }
      }
    });
    
    console.log('📊 ANÁLISIS DE DOCUMENTOS DE CLIENTES\n');
    
    for (const booking of bookings) {
      console.log(`📁 Reserva: ${booking.booking_number}`);
      console.log(`   Cliente: ${booking.customer?.first_name} ${booking.customer?.last_name} (ID: ${booking.customer?.id})`);
      
      if (!booking.customer) {
        console.log('   ⚠️  Sin cliente asociado\n');
        continue;
      }
      
      const docs = {
        'Carnet Conducir (Frontal)': booking.customer.driver_license_front,
        'Carnet Conducir (Trasero)': booking.customer.driver_license_back,
        'DNI/ID (Frontal)': booking.customer.id_document_front,
        'DNI/ID (Trasero)': booking.customer.id_document_back
      };
      
      let hasAnyDoc = false;
      
      for (const [docName, docPath] of Object.entries(docs)) {
        if (docPath) {
          console.log(`   ✅ ${docName}: ${docPath}`);
          hasAnyDoc = true;
        } else {
          console.log(`   ❌ ${docName}: NO SUBIDO`);
        }
      }
      
      if (!hasAnyDoc) {
        console.log('   ⚠️  CLIENTE SIN DOCUMENTOS - Por eso la carpeta está vacía');
      }
      
      console.log('');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

checkDocs();
