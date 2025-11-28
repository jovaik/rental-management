require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixRiccoStatus() {
  try {
    // Buscar cliente RICCO
    const ricco = await prisma.carRentalCustomers.findFirst({
      where: {
        OR: [
          { first_name: { contains: 'RICCO', mode: 'insensitive' } },
          { last_name: { contains: 'WHOFFMANN', mode: 'insensitive' } }
        ]
      }
    });

    if (!ricco) {
      console.log('❌ Cliente RICCO no encontrado');
      return;
    }

    console.log('📋 Cliente encontrado:');
    console.log('  ID:', ricco.id);
    console.log('  Nombre:', ricco.first_name, ricco.last_name);
    console.log('  Email:', ricco.email);
    console.log('  Status actual:', ricco.status);
    console.log('');
    console.log('📄 Documentos:');
    console.log('  Carnet frontal:', !!ricco.driver_license_front);
    console.log('  Carnet reverso:', !!ricco.driver_license_back);
    console.log('  DNI frontal:', !!ricco.id_document_front);
    console.log('  DNI reverso:', !!ricco.id_document_back);
    console.log('');

    // Verificar si tiene todos los documentos obligatorios
    const hasAllDocs = ricco.email &&
                      ricco.driver_license_front &&
                      ricco.driver_license_back &&
                      ricco.id_document_front &&
                      ricco.id_document_back;

    console.log('✅ Tiene todos los documentos obligatorios:', hasAllDocs);

    if (hasAllDocs && ricco.status === 'incomplete') {
      console.log('');
      console.log('🔧 Actualizando status a "active"...');
      
      const updated = await prisma.carRentalCustomers.update({
        where: { id: ricco.id },
        data: { status: 'active' }
      });

      console.log('✅ Cliente actualizado correctamente');
      console.log('  Nuevo status:', updated.status);
    } else if (ricco.status === 'active') {
      console.log('');
      console.log('✅ El cliente ya está activo, no necesita cambios');
    } else {
      console.log('');
      console.log('❌ Faltan documentos obligatorios, no se puede activar');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRiccoStatus();
