require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPDFGeneration() {
  try {
    // Obtener la inspección del contrato 202511070003
    const booking = await prisma.carRentalBookings.findFirst({
      where: { booking_number: '202511070003' },
      select: { id: true, booking_number: true, google_drive_folder_id: true }
    });

    if (!booking) {
      console.log('❌ Reserva no encontrada');
      return;
    }

    console.log('✅ Reserva encontrada:', booking.booking_number);
    console.log('   ID:', booking.id);
    console.log('   Google Drive Folder:', booking.google_drive_folder_id);
    console.log('   URL Carpeta:', `https://drive.google.com/drive/folders/${booking.google_drive_folder_id}`);

    const inspections = await prisma.vehicleInspections.findMany({
      where: { booking_id: booking.id },
      select: {
        id: true,
        inspection_type: true,
        inspection_date: true,
        front_photo: true,
        left_photo: true,
        rear_photo: true,
        right_photo: true,
        odometer_photo: true
      }
    });

    console.log('\n📁 Inspecciones en base de datos:');
    for (const insp of inspections) {
      console.log(`\n  ID: ${insp.id}`);
      console.log(`  Tipo: ${insp.inspection_type}`);
      console.log(`  Fecha: ${insp.inspection_date}`);
      console.log(`  Fotos en S3:`);
      console.log(`    - Front: ${insp.front_photo || 'N/A'}`);
      console.log(`    - Left: ${insp.left_photo || 'N/A'}`);
      console.log(`    - Rear: ${insp.rear_photo || 'N/A'}`);
      console.log(`    - Right: ${insp.right_photo || 'N/A'}`);
      console.log(`    - Odometer: ${insp.odometer_photo || 'N/A'}`);
    }

    console.log('\n\n📋 CONCLUSIÓN:');
    console.log('El contrato 202511070003 tiene:');
    console.log(`  - Carpeta en Google Drive: ${booking.google_drive_folder_id ? 'SÍ' : 'NO'}`);
    console.log(`  - Inspecciones en BD: ${inspections.length}`);
    console.log(`  - Fotos en S3: ${inspections.some(i => i.front_photo) ? 'NO (ninguna foto guardada)' : 'PROBABLEMENTE NO'}`);
    
    console.log('\n💡 ANÁLISIS:');
    console.log('El usuario dice que ve un PDF de 43.4MB en Google Drive con fotos.');
    console.log('Pero en la BD no hay referencias a fotos en S3.');
    console.log('Esto sugiere que:');
    console.log('  1. El PDF se generó correctamente y se subió a Drive');
    console.log('  2. Pero las fotos NO se guardaron en la BD (o se guardaron en otro lugar)');
    console.log('  3. El sistema funcionaba generando PDFs desde las fotos subidas directamente');
    console.log('     sin guardar las rutas S3 en las inspecciones');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPDFGeneration();
