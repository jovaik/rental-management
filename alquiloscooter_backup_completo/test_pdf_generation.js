const { PrismaClient } = require('@prisma/client');
const { downloadFile } = require('./lib/s3');
require('dotenv').config();

const prisma = new PrismaClient();

async function testImageConversion() {
  try {
    // Obtener inspección 51
    const inspection = await prisma.vehicleInspections.findUnique({
      where: { id: 51 }
    });
    
    if (!inspection) {
      console.log('❌ Inspección no encontrada');
      return;
    }
    
    console.log('=== PRUEBA DE CONVERSIÓN DE IMÁGENES ===\n');
    
    const photos = [
      { name: 'Frontal', key: inspection.front_photo },
      { name: 'Izquierda', key: inspection.left_photo },
      { name: 'Trasera', key: inspection.rear_photo },
      { name: 'Derecha', key: inspection.right_photo },
      { name: 'Odómetro', key: inspection.odometer_photo }
    ];
    
    for (const photo of photos) {
      if (!photo.key) {
        console.log(`❌ ${photo.name}: NO DISPONIBLE`);
        continue;
      }
      
      console.log(`\n📸 Procesando ${photo.name}...`);
      console.log(`   S3 Key: ${photo.key}`);
      
      try {
        // Intentar obtener URL firmada
        const signedUrl = await downloadFile(photo.key);
        console.log(`   ✅ URL firmada obtenida`);
        console.log(`   URL: ${signedUrl.substring(0, 80)}...`);
        
        // Intentar descargar
        const response = await fetch(signedUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          console.log(`   ✅ Imagen descargada: ${buffer.length} bytes`);
          
          // Intentar optimizar con sharp
          try {
            const sharp = require('sharp');
            const optimizedBuffer = await sharp(buffer)
              .resize(800, null, { fit: 'inside', withoutEnlargement: true })
              .jpeg({ quality: 75 })
              .toBuffer();
            
            console.log(`   ✅ Imagen optimizada: ${optimizedBuffer.length} bytes (${Math.round((optimizedBuffer.length/buffer.length)*100)}% del original)`);
            
            // Convertir a base64
            const base64 = optimizedBuffer.toString('base64');
            console.log(`   ✅ Base64 generado: ${base64.length} caracteres`);
          } catch (sharpError) {
            console.log(`   ❌ Error con Sharp:`, sharpError.message);
          }
        } else {
          console.log(`   ❌ Error descargando: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testImageConversion();
