// Cargar las variables de entorno del backup manualmente
process.env.DATABASE_URL = "postgresql://role_5f4c8d7db:HjDZDNxgN01PorW4ozp2phgmd7OWrEb0@db-5f4c8d7db.db002.hosteddb.reai.io:5432/5f4c8d7db?connect_timeout=15";

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuarios en la base de datos...\n');
    await prisma.$connect();
    console.log('✅ Conectado exitosamente\n');
    
    // Listar todos los usuarios
    console.log('👥 TODOS LOS USUARIOS en car_rental_users:\n');
    const users = await prisma.$queryRaw`
      SELECT id, email, username, firstname, lastname, role, status
      FROM car_rental_users 
      ORDER BY id
    `;
    
    if (users.length > 0) {
      console.log(`Total: ${users.length} usuarios encontrados\n`);
      users.forEach((user, idx) => {
        console.log(`${idx + 1}. ID: ${user.id}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👤 Username: ${user.username || 'N/A'}`);
        console.log(`   📝 Nombre: ${user.firstname} ${user.lastname}`);
        console.log(`   🔑 Rol: ${user.role}`);
        console.log(`   ✅ Estado: ${user.status}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No se encontraron usuarios\n');
    }
    
    // Buscar específicamente owner@demo.com
    console.log('\n🔍 Buscando usuario owner@demo.com...\n');
    const ownerUser = await prisma.$queryRaw`
      SELECT * FROM car_rental_users WHERE email = 'owner@demo.com'
    `;
    
    if (ownerUser.length > 0) {
      console.log('✅ Usuario owner@demo.com ENCONTRADO:');
      console.log(ownerUser[0]);
    } else {
      console.log('❌ Usuario owner@demo.com NO ENCONTRADO en la base de datos');
    }
    
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
