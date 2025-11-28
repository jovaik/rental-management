require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkContracts() {
  try {
    const contracts = await prisma.carRentalContracts.findMany({
      take: 2,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        booking_id: true,
        contract_number: true,
        contract_text: true,
        signed_at: true
      }
    });
    
    console.log(`\n✅ Encontrados ${contracts.length} contratos recientes\n`);
    
    for (const contract of contracts) {
      console.log('\n==================================================');
      console.log('Contrato:', contract.contract_number);
      console.log('ID:', contract.id, '| Booking ID:', contract.booking_id);
      console.log('Firmado:', contract.signed_at ? 'Sí' : 'No');
      console.log('==================================================');
      
      if (!contract.contract_text || contract.contract_text.length === 0) {
        console.log('❌ CONTRATO VACÍO - SIN HTML');
        continue;
      }
      
      console.log('Longitud HTML:', contract.contract_text.length, 'caracteres');
      
      // Contar elementos clave
      const imgCount = (contract.contract_text.match(/<img/g) || []).length;
      const hasInspection = contract.contract_text.toLowerCase().includes('inspecci');
      const hasVehicle = contract.contract_text.toLowerCase().includes('veh');
      const hasCustomer = contract.contract_text.toLowerCase().includes('cliente') || 
                         contract.contract_text.toLowerCase().includes('customer');
      
      console.log('\n📊 Análisis del contenido:');
      console.log('- Imágenes:', imgCount);
      console.log('- Sección de inspección:', hasInspection ? 'SÍ' : 'NO');
      console.log('- Datos del vehículo:', hasVehicle ? 'SÍ' : 'NO');
      console.log('- Datos del cliente:', hasCustomer ? 'SÍ' : 'NO');
      
      // Mostrar primeros 200 caracteres
      const preview = contract.contract_text.substring(0, 200).replace(/\s+/g, ' ');
      console.log('\n📄 Preview:', preview + '...');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

checkContracts();
