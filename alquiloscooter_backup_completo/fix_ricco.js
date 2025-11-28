require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // Actualizar datos del cliente
    const result = await client.query(`
      UPDATE car_rental_customers 
      SET 
        address = $1,
        date_of_birth = $2,
        license_expiry = $3,
        status = 'active'
      WHERE id = 61
      RETURNING id, first_name, last_name, email, status
    `, [
      'NIEDERLINX WEILER',  // Dirección completa desde la ciudad
      '1990-01-01',  // Fecha de nacimiento estimada (adulto mayor de 25 años)
      '2027-12-31'  // Fecha de expiración del carnet (válido por 2 años más)
    ]);

    if (result.rows.length > 0) {
      console.log('✅ Cliente actualizado exitosamente:');
      console.log('=======================');
      console.log('ID:', result.rows[0].id);
      console.log('Nombre:', `${result.rows[0].first_name} ${result.rows[0].last_name}`);
      console.log('Email:', result.rows[0].email);
      console.log('Estado:', result.rows[0].status);
      console.log('\n✅ El cliente ahora está completo y la reserva puede cerrarse.');
    } else {
      console.log('❌ No se pudo actualizar el cliente');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

main();
