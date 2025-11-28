const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function verifyProdLogin() {
  const connectionString = "postgresql://role_5f4c8d7db:HjDZDNxgN01PorW4ozp2phgmd7OWrEb0@db-5f4c8d7db.db002.hosteddb.reai.io:5432/5f4c8d7db?connect_timeout=15";
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    
    // Obtener el usuario
    const result = await client.query(`
      SELECT email, password, firstname, lastname, role, status
      FROM car_rental_users 
      WHERE email = 'josemillanfdez@gmail.com'
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    const user = result.rows[0];
    
    // Verificar la contraseña
    const passwordMatch = await bcrypt.compare('prod2025', user.password);
    
    console.log('🔍 VERIFICACIÓN DE LOGIN PROD:\n');
    console.log(`✅ Usuario encontrado: ${user.email}`);
    console.log(`✅ Nombre: ${user.firstname} ${user.lastname}`);
    console.log(`✅ Rol: ${user.role}`);
    console.log(`✅ Estado: ${user.status === 'T' ? 'Activo' : 'Inactivo'}`);
    console.log(`✅ Contraseña válida: ${passwordMatch ? 'SÍ ✓' : 'NO ✗'}`);
    
    if (passwordMatch && user.status === 'T') {
      console.log('\n🎉 ¡LOGIN CORRECTO! Puedes acceder a PROD con estas credenciales.');
    } else {
      console.log('\n⚠️ Hay un problema con el login.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyProdLogin();
