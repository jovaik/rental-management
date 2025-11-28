const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function crearPropietarios() {
  try {
    console.log("\n=== CREANDO USUARIOS PROPIETARIOS ===\n");
    
    // Propietario 1
    const email1 = "propietario1@alquiloscooter.com";
    await prisma.carRentalUsers.deleteMany({ where: { email: email1 } });
    
    const hash1 = await bcrypt.hash('propietario123', 10);
    const prop1 = await prisma.carRentalUsers.create({
      data: {
        email: email1,
        password: hash1,
        firstname: 'María',
        lastname: 'García Propietaria',
        role: 'propietario',
      },
    });
    console.log(`✅ Propietario 1 creado:`);
    console.log(`   Email: ${prop1.email}`);
    console.log(`   Contraseña: propietario123`);
    console.log(`   Rol: ${prop1.role}`);
    
    // Propietario 2
    const email2 = "propietario2@alquiloscooter.com";
    await prisma.carRentalUsers.deleteMany({ where: { email: email2 } });
    
    const hash2 = await bcrypt.hash('propietario123', 10);
    const prop2 = await prisma.carRentalUsers.create({
      data: {
        email: email2,
        password: hash2,
        firstname: 'Carlos',
        lastname: 'Rodríguez Propietario',
        role: 'propietario',
      },
    });
    console.log(`\n✅ Propietario 2 creado:`);
    console.log(`   Email: ${prop2.email}`);
    console.log(`   Contraseña: propietario123`);
    console.log(`   Rol: ${prop2.role}`);
    
    // Cesionario
    const email3 = "cesionario1@alquiloscooter.com";
    await prisma.carRentalUsers.deleteMany({ where: { email: email3 } });
    
    const hash3 = await bcrypt.hash('cesionario123', 10);
    const ces1 = await prisma.carRentalUsers.create({
      data: {
        email: email3,
        password: hash3,
        firstname: 'Luis',
        lastname: 'Martínez Cesionario',
        role: 'cesionario',
      },
    });
    console.log(`\n✅ Cesionario creado:`);
    console.log(`   Email: ${ces1.email}`);
    console.log(`   Contraseña: cesionario123`);
    console.log(`   Rol: ${ces1.role}`);
    
    console.log("\n🎉 USUARIOS CREADOS EXITOSAMENTE\n");
    
  } catch (error) {
    console.error("❌ ERROR:", error);
  } finally {
    await prisma.$disconnect();
  }
}

crearPropietarios();
