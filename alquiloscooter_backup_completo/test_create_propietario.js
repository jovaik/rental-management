const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testCreatePropietario() {
  try {
    console.log("🔍 Verificando usuarios existentes con rol 'propietario'...");
    
    const existingPropietarios = await prisma.carRentalUsers.findMany({
      where: { role: 'propietario' },
      select: { id: true, email: true, firstname: true, lastname: true, role: true }
    });
    
    console.log(`✅ Usuarios con rol 'propietario' encontrados: ${existingPropietarios.length}`);
    existingPropietarios.forEach(u => {
      console.log(`   - ID: ${u.id}, Email: ${u.email}, Nombre: ${u.firstname} ${u.lastname}`);
    });
    
    console.log("\n🔧 Intentando crear un nuevo usuario con rol 'propietario'...");
    
    const testEmail = `propietario_test_${Date.now()}@test.com`;
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const newUser = await prisma.carRentalUsers.create({
      data: {
        email: testEmail,
        password: hashedPassword,
        firstname: 'Test',
        lastname: 'Propietario',
        role: 'propietario',
      },
    });
    
    console.log(`✅ Usuario creado exitosamente!`);
    console.log(`   - ID: ${newUser.id}`);
    console.log(`   - Email: ${newUser.email}`);
    console.log(`   - Rol: ${newUser.role}`);
    
    // Eliminar el usuario de prueba
    console.log(`\n🗑️  Eliminando usuario de prueba...`);
    await prisma.carRentalUsers.delete({ where: { id: newUser.id } });
    console.log(`✅ Usuario de prueba eliminado`);
    
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testCreatePropietario();
