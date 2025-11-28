import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const prisma = new PrismaClient();

async function checkSchema() {
  try {
    // Obtener una inspección para ver todos los campos disponibles
    const inspection = await prisma.vehicleInspections.findFirst();
    
    if (inspection) {
      console.log('\n📋 Campos disponibles en VehicleInspections:');
      console.log(Object.keys(inspection));
    } else {
      console.log('❌ No hay inspecciones en la base de datos');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
