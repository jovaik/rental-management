import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

async function actualizarClientesCompletos() {
  try {
    console.log('🔍 Buscando clientes con status "incomplete"...\n');
    
    // Buscar todos los clientes incompletos
    const clientesIncompletos = await prisma.carRentalCustomers.findMany({
      where: {
        status: 'incomplete'
      }
    });

    console.log(`📋 Total clientes con status "incomplete": ${clientesIncompletos.length}\n`);
    
    let actualizados = 0;
    let noActualizados = 0;
    
    for (const cliente of clientesIncompletos) {
      // Verificar si cumple con los nuevos criterios (nombre, apellido, email, teléfono)
      const cumpleCriterios = cliente.first_name && 
                             cliente.last_name && 
                             cliente.email && 
                             cliente.phone;
      
      if (cumpleCriterios) {
        console.log(`✅ Cliente ${cliente.id}: ${cliente.first_name} ${cliente.last_name}`);
        console.log(`   Email: ${cliente.email}, Teléfono: ${cliente.phone}`);
        console.log(`   → Actualizando a "active"...`);
        
        await prisma.carRentalCustomers.update({
          where: { id: cliente.id },
          data: { status: 'active' }
        });
        
        actualizados++;
        console.log(`   ✓ Actualizado\n`);
      } else {
        console.log(`⚠️ Cliente ${cliente.id}: ${cliente.first_name || '(sin nombre)'} ${cliente.last_name || '(sin apellido)'}`);
        console.log(`   Email: ${cliente.email || '(sin email)'}, Teléfono: ${cliente.phone || '(sin teléfono)'}`);
        console.log(`   → Sigue siendo "incomplete" (faltan campos obligatorios)\n`);
        noActualizados++;
      }
    }
    
    console.log('\n═══════════════════════════════════════');
    console.log('📊 RESUMEN:');
    console.log(`   ✅ Actualizados a "active": ${actualizados}`);
    console.log(`   ⚠️ Siguen "incomplete": ${noActualizados}`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

actualizarClientesCompletos();
