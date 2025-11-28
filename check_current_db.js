// Usar la base de datos actual del proyecto
process.env.DATABASE_URL = "postgresql://role_43c1c84ad:sEELkXUYGfVvh4naABX9p2XZgDP3UKMC@db-43c1c84ad.db003.hosteddb.reai.io:5432/43c1c84ad?connect_timeout=15";

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCurrentDb() {
  try {
    console.log('🔍 Verificando la base de datos ACTUAL del proyecto...\n');
    await prisma.$connect();
    console.log('✅ Conectado exitosamente\n');
    
    // Listar todas las tablas
    console.log('📋 Tablas en la base de datos actual:\n');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log(`Total: ${tables.length} tablas encontradas\n`);
    
    if (tables.length > 0) {
      // Mostrar conteo de usuarios
      try {
        const users = await prisma.$queryRaw`
          SELECT id, email, username, firstname, lastname, role, status
          FROM car_rental_users 
          ORDER BY id
        `;
        
        console.log('👥 Usuarios en car_rental_users:\n');
        console.log(`Total: ${users.length} usuarios\n`);
        
        if (users.length > 0) {
          users.forEach((user, idx) => {
            console.log(`${idx + 1}. ${user.email} | ${user.role} | Estado: ${user.status}`);
          });
        } else {
          console.log('⚠️  NO HAY USUARIOS - Necesita ejecutar el seed');
        }
      } catch (err) {
        console.log('⚠️  Error al consultar usuarios:', err.message);
      }
    } else {
      console.log('⚠️  La base de datos está VACÍA - No hay tablas creadas');
      console.log('   Necesita ejecutar: npx prisma migrate dev');
    }
    
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentDb();
