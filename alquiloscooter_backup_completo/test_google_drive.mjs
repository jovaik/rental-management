import dotenv from 'dotenv';
dotenv.config();

async function testGoogleDrive() {
  try {
    console.log('🧪 Testeando integración con Google Drive...\n');
    
    // Importar módulo
    const { createBookingFolder, uploadFileToBookingFolder } = await import('./lib/google-drive.ts');
    
    // Test 1: Crear carpeta de prueba
    console.log('📁 Test 1: Crear carpeta de prueba...');
    const folderResult = await createBookingFolder(
      'TEST-20251105-001',
      'Cliente de Prueba',
      999
    );
    
    if (folderResult.success) {
      console.log('✅ Carpeta creada exitosamente');
      console.log(`   ID: ${folderResult.folderId}`);
      console.log(`   URL: ${folderResult.folderUrl}\n`);
      
      // Test 2: Subir archivo de prueba
      console.log('📄 Test 2: Subir archivo de prueba...');
      const testContent = Buffer.from('Este es un archivo de prueba para Google Drive');
      const uploadResult = await uploadFileToBookingFolder(
        'TEST-20251105-001',
        'test-documento.txt',
        testContent,
        'text/plain'
      );
      
      if (uploadResult.success) {
        console.log('✅ Archivo subido exitosamente');
        console.log(`   ID: ${uploadResult.fileId}`);
        console.log(`   URL: ${uploadResult.fileUrl}\n`);
      } else {
        console.error('❌ Error subiendo archivo:', uploadResult.error);
      }
      
    } else {
      console.error('❌ Error creando carpeta:', folderResult.error);
    }
    
    console.log('\n✅ Tests completados');
    
  } catch (error) {
    console.error('❌ Error en tests:', error);
  }
}

testGoogleDrive();
