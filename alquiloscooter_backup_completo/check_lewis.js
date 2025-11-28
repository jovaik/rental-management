require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLewis() {
  try {
    // Buscar Lewis Anderson
    const lewis = await prisma.carRentalCustomers.findMany({
      where: {
        OR: [
          { first_name: { contains: 'Lewis', mode: 'insensitive' } },
          { first_name: { contains: 'Anderson', mode: 'insensitive' } },
          { last_name: { contains: 'Lewis', mode: 'insensitive' } },
          { last_name: { contains: 'Anderson', mode: 'insensitive' } }
        ]
      }
    });

    console.log('🔍 Clientes encontrados:', lewis.length);
    
    for (const cliente of lewis) {
      console.log('\n📋 Cliente:', cliente.id);
      console.log('  Nombre:', cliente.first_name);
      console.log('  Apellido:', cliente.last_name);
      console.log('  Email:', cliente.email);
      console.log('  Teléfono:', cliente.phone);
      console.log('  DNI:', cliente.dni_nie);
      console.log('  Dirección:', cliente.street_address);
      console.log('  ⚠️ STATUS ACTUAL:', cliente.status);
      
      // Verificar si cumple con los nuevos criterios
      const cumpleCriterios = cliente.first_name && 
                             cliente.last_name && 
                             cliente.email && 
                             cliente.phone;
      
      console.log('  ✅ Cumple criterios obligatorios:', cumpleCriterios);
      
      if (cumpleCriterios && cliente.status === 'incomplete') {
        console.log('  🔧 ACTUALIZANDO A "active"...');
        await prisma.carRentalCustomers.update({
          where: { id: cliente.id },
          data: { status: 'active' }
        });
        console.log('  ✅ ACTUALIZADO EXITOSAMENTE');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLewis();
