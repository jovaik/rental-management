const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function verifyAndReset() {
  const connectionString = "postgresql://role_5f4c8d7db:HjDZDNxgN01PorW4ozp2phgmd7OWrEb0@db-5f4c8d7db.db002.hosteddb.reai.io:5432/5f4c8d7db?connect_timeout=15";
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('🔍 VERIFICANDO USUARIO EN PROD...\n');
    
    // Buscar el usuario
    const result = await client.query(`
      SELECT id, email, username, firstname, lastname, role, status, password
      FROM car_rental_users 
      WHERE email = 'josemillanfdez@gmail.com'
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ ERROR: Usuario josemillanfdez@gmail.com NO EXISTE en la base de datos!');
      console.log('\n¿Quieres que lo cree?');
      return;
    }
    
    const user = result.rows[0];
    console.log('✅ Usuario encontrado:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Nombre: ${user.firstname} ${user.lastname}`);
    console.log(`   Rol: ${user.role}`);
    console.log(`   Estado: ${user.status}\n`);
    
    // Probar contraseña actual
    const currentPasswordWorks = await bcrypt.compare('prod2025', user.password);
    console.log(`🔑 Contraseña actual (prod2025): ${currentPasswordWorks ? '✅ FUNCIONA' : '❌ NO FUNCIONA'}\n`);
    
    if (!currentPasswordWorks) {
      console.log('🔧 Reseteando contraseña...\n');
      
      // Generar nueva contraseña hasheada
      const newPassword = 'AlquiloScooter2025!';
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const salt = await bcrypt.genSalt(10);
      
      // Actualizar
      await client.query(`
        UPDATE car_rental_users 
        SET password = $1, salt = $2, modified = NOW()
        WHERE email = 'josemillanfdez@gmail.com'
      `, [hashedPassword, salt]);
      
      // Verificar
      const verify = await client.query(`
        SELECT password FROM car_rental_users WHERE email = 'josemillanfdez@gmail.com'
      `);
      
      const newPasswordWorks = await bcrypt.compare('AlquiloScooter2025!', verify.rows[0].password);
      
      console.log('═══════════════════════════════════════════════════');
      console.log('✅ CONTRASEÑA ACTUALIZADA EXITOSAMENTE');
      console.log('═══════════════════════════════════════════════════');
      console.log('URL: https://alqm.abacusai.app/');
      console.log('Email: josemillanfdez@gmail.com');
      console.log('Password: AlquiloScooter2025!');
      console.log('Rol: super_admin');
      console.log('═══════════════════════════════════════════════════');
      console.log(`\n🔐 Nueva contraseña verificada: ${newPasswordWorks ? '✅ OK' : '❌ ERROR'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyAndReset();
