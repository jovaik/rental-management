import { PrismaClient } from '@prisma/client';
import { downloadFile } from '@/lib/s3';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function testImageConversion() {
  try {
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
      
      console.log(`\n📸 ${photo.name}: ${photo.key}`);
      
      try {
        const signedUrl = await downloadFile(photo.key);
        console.log(`   ✅ URL firmada obtenida`);
        
        const response = await fetch(signedUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          console.log(`   ✅ Descargada: ${buffer.length} bytes`);
        } else {
          console.log(`   ❌ Error: ${response.status}`);
        }
      } catch (error: any) {
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
