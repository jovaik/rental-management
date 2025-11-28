require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixLewis() {
  try {
    // Buscar Lewis Anderson por ID
    const lewis = await prisma.carRentalCustomers.findUnique({
      where: { id: 60 }
    });

    console.log('\n📋 ANTES DE ACTUALIZAR:');
    console.log('  ID:', lewis.id);
    console.log('  Nombre:', lewis.first_name);
    console.log('  Apellido:', lewis.last_name);
    console.log('  Email:', lewis.email);
    console.log('  Teléfono:', lewis.phone);
    console.log('  STATUS:', lewis.status);
    
    // Actualizar a active
    const updated = await prisma.carRentalCustomers.update({
      where: { id: 60 },
      data: { status: 'active' }
    });
    
    console.log('\n✅ DESPUÉS DE ACTUALIZAR:');
    console.log('  STATUS:', updated.status);
    
    // Verificar que se guardó
    const verified = await prisma.carRentalCustomers.findUnique({
      where: { id: 60 }
    });
    
    console.log('\n🔍 VERIFICACIÓN FINAL:');
    console.log('  STATUS:', verified.status);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixLewis();
