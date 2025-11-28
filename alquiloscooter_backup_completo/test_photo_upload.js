require('dotenv').config();
const fs = require('fs');
const { uploadFile } = require('./lib/s3.ts');
const { getBookingFilePath } = require('./lib/booking-number.ts');

async function testUpload() {
  try {
    console.log('\n🧪 TEST: Subiendo foto de prueba a S3...');
    
    // Crear un buffer de prueba (imagen falsa)
    const testBuffer = Buffer.from('fake-image-data-for-testing');
    const bookingNumber = '202511050001'; // Reserva 120
    const expedienteFolder = getBookingFilePath(bookingNumber, 'inspecciones');
    const fileName = `test-front-${Date.now()}.jpg`;
    const s3Key = `${expedienteFolder}${fileName}`;
    
    console.log('📤 Subiendo a:', s3Key);
    
    const uploadedKey = await uploadFile(testBuffer, s3Key);
    
    console.log('✅ Subida exitosa:', uploadedKey);
    console.log('\n💡 La subida a S3 funciona correctamente');
    
  } catch (error) {
    console.error('❌ Error en subida:', error);
    console.error('\n💡 La subida a S3 tiene un problema');
  }
}

testUpload();
