require('dotenv/config');

const GSCONTROL_CONFIG = {
  endpoint: process.env.GSCONTROL_ENDPOINT || '',
  apiKey: process.env.GSCONTROL_API_KEY || '',
};

async function eliminarPorExternalId(externalIds) {
  try {
    console.log(`🗑️  Eliminando transacciones de GSControl...\n`);
    console.log(`   IDs: ${externalIds.join(', ')}\n`);
    
    const response = await fetch(GSCONTROL_CONFIG.endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${GSCONTROL_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ externalIds }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al eliminar: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    
    console.log('✅ Resultado:');
    console.log(`   • Eliminadas: ${result.deleted || 0}`);
    console.log(`   • Errores: ${result.errors || 0}`);
    
    if (result.results?.deleted) {
      console.log('\n✅ Transacciones eliminadas exitosamente:');
      result.results.deleted.forEach(id => console.log(`   - ${id}`));
    }
    
    if (result.results?.errors && result.results.errors.length > 0) {
      console.log('\n⚠️  Errores:');
      result.results.errors.forEach(err => {
        console.log(`   - ${err.externalId}: ${err.error}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Uso: node eliminar_por_external_id.js <external_id_1> <external_id_2> ...
const externalIds = process.argv.slice(2);

if (externalIds.length === 0) {
  console.log('❌ Uso: node eliminar_por_external_id.js <external_id_1> <external_id_2> ...');
  console.log('\nEjemplo: node eliminar_por_external_id.js booking_123 booking_456');
  process.exit(1);
}

eliminarPorExternalId(externalIds);
