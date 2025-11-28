require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkContract() {
  try {
    // Buscar la reserva por número de contrato
    const booking = await prisma.carRentalBookings.findFirst({
      where: {
        booking_number: '202511070003'
      },
      include: {
        vehicles: {
          include: {
            car: true
          }
        },
        customer: true,
        inspections: true
      }
    });

    if (!booking) {
      console.log('❌ Contrato 202511070003 no encontrado');
      return;
    }

    console.log('\n✅ CONTRATO ENCONTRADO:');
    console.log('ID:', booking.id);
    console.log('Número:', booking.booking_number);
    console.log('Cliente:', booking.customer?.name);
    console.log('Fecha creación:', booking.created_at);
    console.log('Google Drive Folder ID:', booking.google_drive_folder_id);
    
    console.log('\n📁 TODAS LAS INSPECCIONES:');
    for (const insp of booking.inspections) {
      console.log('  - ID:', insp.id);
      console.log('    Tipo:', insp.inspection_type);
      console.log('    Fecha:', insp.inspection_date);
      console.log('    Fotos en S3:');
      console.log('      Front:', insp.photo_front || 'N/A');
      console.log('      Left:', insp.photo_left || 'N/A');
      console.log('      Rear:', insp.photo_rear || 'N/A');
      console.log('      Right:', insp.photo_right || 'N/A');
      console.log('      Odometer:', insp.photo_odometer || 'N/A');
      console.log('    Google Drive File ID:', insp.google_drive_file_id || 'N/A');
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkContract();
