// Cargar las variables de entorno del backup manualmente
process.env.DATABASE_URL = "postgresql://role_5f4c8d7db:HjDZDNxgN01PorW4ozp2phgmd7OWrEb0@db-5f4c8d7db.db002.hosteddb.reai.io:5432/5f4c8d7db?connect_timeout=15";

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listTables() {
  try {
    console.log('🔍 Conectando a la base de datos del backup...\n');
    await prisma.$connect();
    console.log('✅ Conectado exitosamente\n');
    
    // Listar todas las tablas
    console.log('📋 TODAS LAS TABLAS en la base de datos:\n');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    if (tables.length > 0) {
      console.log(`Total: ${tables.length} tablas encontradas\n`);
      tables.forEach((table, idx) => {
        console.log(`  ${idx + 1}. ${table.table_name}`);
      });
      console.log('');
      
      // Para cada tabla, mostrar el conteo de registros
      console.log('\n📊 CONTEO DE REGISTROS por tabla:\n');
      for (const table of tables) {
        try {
          const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) FROM "${table.table_name}"`);
          console.log(`  ${table.table_name}: ${count[0].count} registros`);
        } catch (err) {
          console.log(`  ${table.table_name}: Error - ${err.message}`);
        }
      }
    } else {
      console.log('⚠️  No se encontraron tablas en la base de datos\n');
    }
    
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listTables();
