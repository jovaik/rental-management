require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    const result = await client.query(`
      SELECT 
        id, full_name, email, phone, address, city, country, zip_code, 
        id_document_type, id_document_number, status, birth_date
      FROM car_rental_customers 
      WHERE full_name ILIKE '%RICCO%' OR full_name ILIKE '%WHOFFMANN%'
    `);

    if (result.rows.length === 0) {
      console.log('❌ Cliente no encontrado');
      return;
    }

    const customer = result.rows[0];
    
    console.log('📋 DATOS DEL CLIENTE:');
    console.log('=======================');
    console.log('ID:', customer.id);
    console.log('Nombre:', customer.full_name);
    console.log('Email:', customer.email || '❌ FALTA');
    console.log('Teléfono:', customer.phone || '❌ FALTA');
    console.log('Dirección:', customer.address || '❌ FALTA');
    console.log('Ciudad:', customer.city || '❌ FALTA');
    console.log('País:', customer.country || '❌ FALTA');
    console.log('CP:', customer.zip_code || '❌ FALTA');
    console.log('Tipo Doc:', customer.id_document_type || '❌ FALTA');
    console.log('Núm Doc:', customer.id_document_number || '❌ FALTA');
    console.log('Estado:', customer.status || '❌ FALTA');
    console.log('Nacimiento:', customer.birth_date || '❌ FALTA');

    // Ahora buscar sus reservas
    const bookings = await client.query(`
      SELECT id, status, pickup_date, return_date, total_price
      FROM car_rental_bookings
      WHERE customer_id = $1
      ORDER BY id DESC
      LIMIT 5
    `, [customer.id]);

    console.log('\n📅 RESERVAS:');
    console.log('=======================');
    if (bookings.rows.length > 0) {
      bookings.rows.forEach(b => {
        console.log(`  - Reserva #${b.id}: ${b.status} (Pickup: ${b.pickup_date.toISOString().split('T')[0]}, Total: ${b.total_price}€)`);
      });
    } else {
      console.log('  - Sin reservas');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

main();
