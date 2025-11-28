import { getFileAsBase64 } from './lib/s3';

async function testPhotos() {
  const photos = [
    '5155/expedientes/202511070001/inspecciones/front-1762595891628-119447.jpg',
    '5155/expedientes/202511070001/inspecciones/left-1762595891718-119448.jpg'
  ];

  console.log('\n\n🔍 PROBANDO CONVERSIÓN A BASE64...\n');
  
  for (const photo of photos) {
    console.log(`📸 Procesando: ${photo}`);
    try {
      const base64 = await getFileAsBase64(photo);
      if (base64) {
        console.log(`   ✅ ÉXITO - Longitud: ${base64.length} chars`);
        console.log(`   Primeros 50 chars: ${base64.substring(0, 50)}...`);
      } else {
        console.log(`   ❌ FALLÓ - getFileAsBase64 retornó null`);
      }
    } catch (error) {
      console.error(`   ❌ ERROR:`, error);
    }
    console.log('');
  }
}

testPhotos()
  .catch(console.error)
  .finally(() => process.exit(0));
