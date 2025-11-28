require('dotenv/config');

const GSCONTROL_CONFIG = {
  endpoint: process.env.GSCONTROL_ENDPOINT || '',
  apiKey: process.env.GSCONTROL_API_KEY || '',
};

async function buscarYEliminarVane() {
  try {
    console.log('🔍 Buscando transacción de Vane Cua en GSControl...\n');
    console.log(`   Endpoint: ${GSCONTROL_CONFIG.endpoint}`);
    console.log(`   API Key: ${GSCONTROL_CONFIG.apiKey.substring(0, 20)}...\n`);
    
    // 1. Listar todas las transacciones para encontrar la de Vane
    const listResponse = await fetch(GSCONTROL_CONFIG.endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GSCONTROL_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!listResponse.ok) {
      throw new Error(`Error al listar: ${listResponse.status} ${await listResponse.text()}`);
    }

    const data = await listResponse.json();
    const transacciones = data.data || data || [];
    
    console.log(`📋 Total transacciones encontradas: ${transacciones.length}\n`);
    
    // 2. Buscar la de Vane Cua (301 euros)
    const vaneTransacciones = transacciones.filter(t => {
      const descripcion = (t.description || '').toLowerCase();
      const monto = parseFloat(t.amount || 0);
      const esVane = descripcion.includes('vane') || descripcion.includes('cua');
      const es301 = Math.abs(monto - 301) < 0.01;
      
      return esVane && es301;
    });

    if (vaneTransacciones.length === 0) {
      console.log('⚠️  No se encontró ninguna transacción de Vane Cua de 301€ en GSControl.');
      console.log('   Buscando todas las transacciones con "vane" o "cua" en la descripción...\n');
      
      const todasVane = transacciones.filter(t => {
        const descripcion = (t.description || '').toLowerCase();
        return descripcion.includes('vane') || descripcion.includes('cua');
      });
      
      if (todasVane.length > 0) {
        console.log(`📋 Encontradas ${todasVane.length} transacción(es) relacionadas con Vane/Cua:\n`);
        todasVane.forEach(t => {
          console.log(`  External ID: ${t.externalId}`);
          console.log(`  Descripción: ${t.description}`);
          console.log(`  Monto: €${t.amount}`);
          console.log(`  Fecha: ${t.date}`);
          console.log('  ─'.repeat(30));
        });
      } else {
        console.log('✅ No hay transacciones de Vane Cua en GSControl.');
      }
      
      return;
    }

    console.log(`🎯 Encontradas ${vaneTransacciones.length} transacción(es) de Vane Cua de 301€:\n`);
    
    vaneTransacciones.forEach(t => {
      console.log(`  External ID: ${t.externalId}`);
      console.log(`  Descripción: ${t.description}`);
      console.log(`  Monto: €${t.amount}`);
      console.log(`  Fecha: ${t.date}`);
      console.log('  ─'.repeat(30));
    });

    // 3. Eliminar las transacciones encontradas
    const externalIds = vaneTransacciones.map(t => t.externalId);
    
    console.log(`\n🗑️  Eliminando ${externalIds.length} transacción(es) de GSControl...\n`);
    
    const deleteResponse = await fetch(GSCONTROL_CONFIG.endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${GSCONTROL_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ externalIds }),
    });

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      throw new Error(`Error al eliminar: ${deleteResponse.status} ${errorText}`);
    }

    const deleteResult = await deleteResponse.json();
    
    console.log('✅ Resultado de eliminación:');
    console.log(`   • Eliminadas: ${deleteResult.deleted || 0}`);
    console.log(`   • Errores: ${deleteResult.errors || 0}`);
    
    if (deleteResult.errorDetails && deleteResult.errorDetails.length > 0) {
      console.log('\n⚠️  Detalles de errores:');
      deleteResult.errorDetails.forEach(err => console.log(`   - ${err}`));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

buscarYEliminarVane();
