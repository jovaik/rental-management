
require('dotenv').config();
const { getFileAsBase64 } = require('./lib/s3');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testS3Download() {
  try {
    console.log('\n🧪 TEST: Descarga de fotos desde S3\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Obtener una foto real de la base de datos
    const inspection = await prisma.vehicleInspections.findFirst({
      where: {
        booking_id: 126,
        inspection_type: 'delivery'
      },
      orderBy: {
        id: 'desc'
      }
    });

    if (!inspection || !inspection.front_photo) {
      console.log('❌ No se encontró inspección con foto');
      return;
    }

    console.log(`✅ Inspección encontrada (ID: ${inspection.id})`);
    console.log(`📸 Ruta de foto frontal: ${inspection.front_photo}\n`);

    console.log('🔄 Intentando descargar foto desde S3...\n');
    
    const startTime = Date.now();
    const base64Result = await getFileAsBase64(inspection.front_photo);
    const endTime = Date.now();

    console.log(`⏱️  Tiempo de descarga: ${endTime - startTime}ms\n`);

    if (base64Result) {
      console.log('✅ ¡FOTO DESCARGADA EXITOSAMENTE!');
      console.log(`   Formato: ${base64Result.substring(0, 30)}...`);
      console.log(`   Longitud total: ${base64Result.length} caracteres`);
      console.log(`   ¿Es base64 válido?: ${base64Result.startsWith('data:image/') ? 'SÍ' : 'NO'}`);
      
      if (base64Result.length > 100) {
        console.log('\n💡 La foto se descargó correctamente desde S3 y se convirtió a base64.');
        console.log('   Esto significa que el problema NO está en getFileAsBase64().');
        console.log('\n   EL PROBLEMA DEBE ESTAR EN:');
        console.log('   1. La función convertPhotoToBase64() en /api/contracts/route.ts');
        console.log('   2. O en cómo se pasan las fotos al template');
      }
    } else {
      console.log('❌ getFileAsBase64() retornó NULL');
      console.log('\n   EL PROBLEMA ESTÁ EN lib/s3.ts:');
      console.log('   La función getFileAsBase64() no puede descargar fotos desde S3');
      console.log('   Revisar configuración AWS_BUCKET_NAME y AWS_FOLDER_PREFIX');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('\nStack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testS3Download();
