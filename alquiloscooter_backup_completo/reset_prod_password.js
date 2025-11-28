const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function resetProdPassword() {
  const connectionString = "postgresql://role_5f4c8d7db:HjDZDNxgN01PorW4ozp2phgmd7OWrEb0@db-5f4c8d7db.db002.hosteddb.reai.io:5432/5f4c8d7db?connect_timeout=15";
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('🔧 Reseteando contraseña de PROD...\n');
    
    // Verificar usuario actual
    const before = await client.query(`
      SELECT email, firstname, lastname, role, status
      FROM car_rental_users 
      WHERE email = 'josemillanfdez@gmail.com'
    `);
    
    if (before.rows.length === 0) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    const user = before.rows[0];
    console.log('📊 Usuario encontrado:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Nombre: ${user.firstname} ${user.lastname}`);
    console.log(`   Rol actual: ${user.role}`);
    console.log(`   Estado: ${user.status}\n`);
    
    // Generar nueva contraseña
    const newPassword = 'prod2025';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const salt = await bcrypt.genSalt(10);
    
    // Actualizar contraseña
    await client.query(`
      UPDATE car_rental_users 
      SET password = $1, salt = $2, modified = NOW()
      WHERE email = 'josemillanfdez@gmail.com'
    `, [hashedPassword, salt]);
    
    console.log('✅ Contraseña reseteada exitosamente!\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('📋 CREDENCIALES PARA PROD:');
    console.log('═══════════════════════════════════════════════════');
    console.log('   URL: https://alqm.abacusai.app/');
    console.log('   Email: josemillanfdez@gmail.com');
    console.log('   Password: prod2025');
    console.log('   Rol: super_admin 🌟');
    console.log('═══════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

resetProdPassword();
