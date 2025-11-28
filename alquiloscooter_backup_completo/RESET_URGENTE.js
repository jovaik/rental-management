const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function resetUrgente() {
  const connectionString = "postgresql://role_5f4c8d7db:HjDZDNxgN01PorW4ozp2phgmd7OWrEb0@db-5f4c8d7db.db002.hosteddb.reai.io:5432/5f4c8d7db?connect_timeout=15";
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('🚨 RESET URGENTE DE CONTRASEÑAS...\n');
    
    // Password 1: josemillanfdez@gmail.com
    const pwd1 = 'AlquiloScooter2025!';
    const hash1 = await bcrypt.hash(pwd1, 10);
    const salt1 = await bcrypt.genSalt(10);
    
    await client.query(`
      UPDATE car_rental_users 
      SET password = $1, salt = $2, modified = NOW()
      WHERE email = 'josemillanfdez@gmail.com'
    `, [hash1, salt1]);
    
    console.log('✅ 1. josemillanfdez@gmail.com - ACTUALIZADO');
    
    // Password 2: admin@rental.com
    const pwd2 = 'AlquiloScooter2025!';
    const hash2 = await bcrypt.hash(pwd2, 10);
    const salt2 = await bcrypt.genSalt(10);
    
    await client.query(`
      UPDATE car_rental_users 
      SET password = $1, salt = $2, modified = NOW()
      WHERE email = 'admin@rental.com'
    `, [hash2, salt2]);
    
    console.log('✅ 2. admin@rental.com - ACTUALIZADO\n');
    
    // Verificar
    const verify1 = await client.query(`
      SELECT email, password, role FROM car_rental_users WHERE email = 'josemillanfdez@gmail.com'
    `);
    
    const verify2 = await client.query(`
      SELECT email, password, role FROM car_rental_users WHERE email = 'admin@rental.com'
    `);
    
    const test1 = await bcrypt.compare(pwd1, verify1.rows[0].password);
    const test2 = await bcrypt.compare(pwd2, verify2.rows[0].password);
    
    console.log('═══════════════════════════════════════════════════');
    console.log('🔐 CREDENCIALES ACTUALIZADAS PARA PROD:');
    console.log('═══════════════════════════════════════════════════');
    console.log('URL: https://app.alquiloscooter.com/');
    console.log('');
    console.log('OPCIÓN 1:');
    console.log('Email: josemillanfdez@gmail.com');
    console.log('Password: AlquiloScooter2025!');
    console.log(`Verificación: ${test1 ? '✅ OK' : '❌ ERROR'}`);
    console.log('');
    console.log('OPCIÓN 2:');
    console.log('Email: admin@rental.com');
    console.log('Password: AlquiloScooter2025!');
    console.log(`Verificación: ${test2 ? '✅ OK' : '❌ ERROR'}`);
    console.log('═══════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await client.end();
  }
}

resetUrgente();
