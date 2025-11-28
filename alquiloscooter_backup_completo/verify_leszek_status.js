const { Client } = require('pg');
require('dotenv').config();

async function verify() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT id, first_name, last_name, email, status,
             driver_license_front, driver_license_back,
             id_document_front, id_document_back,
             updated_at
      FROM car_rental_customers
      WHERE first_name ILIKE '%LESZEK%'
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      console.log('Cliente no encontrado');
      return;
    }

    const c = result.rows[0];
    console.log('\n=== ESTADO ACTUAL EN BD ===');
    console.log('ID:', c.id);
    console.log('Nombre:', c.first_name, c.last_name);
    console.log('Email:', c.email);
    console.log('STATUS:', c.status);
    console.log('Última actualización:', c.updated_at);
    console.log('\nDocumentos:');
    console.log('  Carnet frontal:', c.driver_license_front ? '✓ SI' : '✗ NO');
    console.log('  Carnet reverso:', c.driver_license_back ? '✓ SI' : '✗ NO');
    console.log('  DNI frontal:', c.id_document_front ? '✓ SI' : '✗ NO');
    console.log('  DNI reverso:', c.id_document_back ? '✓ SI' : '✗ NO');

    if (c.status !== 'active') {
      console.log('\n⚠️ EL CLIENTE SIGUE COMO:', c.status);
      console.log('Actualizando a active...');
      await client.query(`
        UPDATE car_rental_customers
        SET status = 'active', updated_at = NOW()
        WHERE id = $1
      `, [c.id]);
      console.log('✅ ACTUALIZADO');
    } else {
      console.log('\n✅ El cliente ya está ACTIVE en la BD');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

verify();
