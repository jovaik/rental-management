
require('dotenv').config();
const { Client } = require('pg');

async function removeUniqueConstraint() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');
    
    // Primero, ver qué restricciones tiene la tabla
    console.log('\n=== Restricciones actuales en booking_deposits ===');
    const constraints = await client.query(`
      SELECT conname, contype 
      FROM pg_constraint 
      WHERE conrelid = 'booking_deposits'::regclass;
    `);
    console.log(constraints.rows);
    
    // Buscar y eliminar el índice único booking_deposits_booking_id_key
    const uniqueIndexName = 'booking_deposits_booking_id_key';
    
    console.log(`\n❌ Eliminando índice único: ${uniqueIndexName}`);
    
    await client.query(`DROP INDEX IF EXISTS ${uniqueIndexName};`);
    
    console.log('✅ Índice único eliminado correctamente');
    
    // Verificar índices
    console.log('\n=== Índices actuales en booking_deposits ===');
    const indexes = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'booking_deposits';
    `);
    console.log(indexes.rows);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('\n✅ Desconectado de la base de datos');
  }
}

removeUniqueConstraint();
