const { Client } = require('pg');

async function checkAllUsers() {
  const connectionString = "postgresql://role_5f4c8d7db:HjDZDNxgN01PorW4ozp2phgmd7OWrEb0@db-5f4c8d7db.db002.hosteddb.reai.io:5432/5f4c8d7db?connect_timeout=15";
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT email, firstname, lastname, role, status
      FROM car_rental_users 
      ORDER BY email
      LIMIT 10
    `);
    
    console.log('\n📋 USUARIOS EN LA BASE DE DATOS:\n');
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Nombre: ${user.firstname} ${user.lastname}`);
      console.log(`   Rol: ${user.role}`);
      console.log(`   Estado: ${user.status}\n`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkAllUsers();
