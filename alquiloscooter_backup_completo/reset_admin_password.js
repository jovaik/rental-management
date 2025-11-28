const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
  const connectionString = "postgresql://role_5f4c8d7db:HjDZDNxgN01PorW4ozp2phgmd7OWrEb0@db-5f4c8d7db.db002.hosteddb.reai.io:5432/5f4c8d7db?connect_timeout=15";
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const salt = await bcrypt.genSalt(10);
    
    await client.query(`
      UPDATE car_rental_users 
      SET password = $1, salt = $2, modified = NOW()
      WHERE email = 'admin@rental.com'
    `, [hashedPassword, salt]);
    
    console.log('✅ Contraseña reseteada para admin@rental.com');
    console.log('   Email: admin@rental.com');
    console.log('   Password: admin123\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

resetAdminPassword();
