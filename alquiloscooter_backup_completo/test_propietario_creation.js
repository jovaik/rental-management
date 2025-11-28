const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testPropietario() {
  try {
    console.log("\n=== TEST DE CREACIÓN DE USUARIO PROPIETARIO ===\n");
    
    // 1. Eliminar si existe
    const testEmail = "test_propietario@test.com";
    await prisma.carRentalUsers.deleteMany({
      where: { email: testEmail }
    });
    
    // 2. Crear usuario propietario
    console.log("✅ Paso 1: Creando usuario con rol 'propietario'...");
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
    
    console.log(`   ✓ Usuario creado con ID: ${newUser.id}`);
    console.log(`   ✓ Email: ${newUser.email}`);
    console.log(`   ✓ Rol: ${newUser.role}`);
    
    // 3. Verificar que se guardó correctamente
    console.log("\n✅ Paso 2: Verificando que se guardó correctamente...");
    const verificado = await prisma.carRentalUsers.findUnique({
      where: { email: testEmail },
      select: { id: true, email: true, role: true }
    });
    
    console.log(`   ✓ Verificación exitosa - Rol en BD: "${verificado.role}"`);
    
    // 4. Intentar modificar el rol
    console.log("\n✅ Paso 3: Modificando rol a 'cesionario'...");
    const modificado = await prisma.carRentalUsers.update({
      where: { email: testEmail },
      data: { role: 'cesionario' }
    });
    
    console.log(`   ✓ Rol modificado a: "${modificado.role}"`);
    
    // 5. Volver a modificar a propietario
    console.log("\n✅ Paso 4: Volviendo a cambiar a 'propietario'...");
    const revertido = await prisma.carRentalUsers.update({
      where: { email: testEmail },
      data: { role: 'propietario' }
    });
    
    console.log(`   ✓ Rol revertido a: "${revertido.role}"`);
    
    // 6. Limpiar
    console.log("\n✅ Paso 5: Limpiando datos de prueba...");
    await prisma.carRentalUsers.delete({
      where: { email: testEmail }
    });
    console.log(`   ✓ Usuario de prueba eliminado`);
    
    console.log("\n🎉 TODAS LAS PRUEBAS PASARON EXITOSAMENTE");
    console.log("   → La base de datos SÍ permite crear y modificar usuarios con rol 'propietario'");
    console.log("   → El problema debe estar en el frontend o en el manejo de la sesión\n");
    
  } catch (error) {
    console.error("\n❌ ERROR EN LA PRUEBA:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testPropietario();
