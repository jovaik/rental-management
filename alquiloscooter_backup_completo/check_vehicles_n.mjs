import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const prisma = new PrismaClient();

async function checkVehicles() {
  console.log('🔍 Verificando todos los vehículos que empiezan con "N"...\n');
  
  try {
    const vehicles = await prisma.carRentalCars.findMany({
      where: {
        registration_number: {
          startsWith: 'N'
        }
      },
      orderBy: {
        registration_number: 'asc'
      }
    });
    
    console.log(`✅ Encontrados ${vehicles.length} vehículos:\n`);
    
    vehicles.forEach(v => {
      const statusIcon = v.status === 'T' ? '✅' : '❌';
      console.log(`${statusIcon} ${v.registration_number.padEnd(10)} | ID: ${v.id.toString().padEnd(4)} | ${v.make} ${v.model} | Status: ${v.status}`);
    });
    
    // Verificar si existe exactamente "N48"
    const n48exact = vehicles.find(v => v.registration_number === 'N48');
    
    if (!n48exact) {
      console.log('\n⚠️  NO SE ENCONTRÓ VEHÍCULO CON MATRÍCULA EXACTA "N48"');
      
      // Buscar similares
      const similar = vehicles.filter(v => v.registration_number.includes('48'));
      if (similar.length > 0) {
        console.log('\n📌 Vehículos similares encontrados:');
        similar.forEach(v => {
          console.log(`   - ${v.registration_number} (ID: ${v.id})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVehicles();
