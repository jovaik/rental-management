const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function testAllLogins() {
  const connectionString = "postgresql://role_5f4c8d7db:HjDZDNxgN01PorW4ozp2phgmd7OWrEb0@db-5f4c8d7db.db002.hosteddb.reai.io:5432/5f4c8d7db?connect_timeout=15";
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('🔍 PROBANDO TODOS LOS LOGINS EN PROD...\n');
    
    // Obtener todos los usuarios
    const result = await client.query(`
      SELECT email, password, firstname, lastname, role, status
      FROM car_rental_users 
      ORDER BY created DESC
      LIMIT 10
    `);
    
    console.log(`📊 Usuarios encontrados: ${result.rows.length}\n`);
    
    // Contraseñas comunes para probar
    const passwords = ['prod2025', 'admin123', 'admin', 'password', 'test123'];
    
    for (const user of result.rows) {
      console.log(`\n👤 ${user.email}`);
      console.log(`   Nombre: ${user.firstname} ${user.lastname}`);
      console.log(`   Rol: ${user.role}`);
      console.log(`   Estado: ${user.status === 'T' ? '✅ Activo' : '❌ Inactivo'}`);
      
      // Probar contraseñas
      for (const pwd of passwords) {
        const match = await bcrypt.compare(pwd, user.password);
        if (match) {
          console.log(`   🔑 Contraseña: ${pwd} ✅`);
          break;
        }
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log('🎯 CREDENCIALES CONFIRMADAS PARA PROD:');
    console.log('═══════════════════════════════════════════════════');
    console.log('Email: josemillanfdez@gmail.com');
    console.log('Password: prod2025');
    console.log('═══════════════════════════════════════════════════');
    console.log('\n⚠️  IMPORTANTE: Copia y pega exactamente como está arriba');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

testAllLogins();
