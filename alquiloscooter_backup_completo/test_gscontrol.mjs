import fetch from 'node-fetch';

const API_KEY = 'gs_b4f8c1e6d9a2e5f7b3c8d1e9f6a4b7c2e5f8d1a3b6c9e2f5a8b1d4e7f0c3a6b9';
const ENDPOINT = 'https://gscontrol.abacusai.app/api/integrations/sync';

console.log('🔍 VERIFICACIÓN COMPLETA DE GSCONTROL\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 1. VERIFICAR ESTADO ACTUAL
console.log('1️⃣  Consultando estado de sincronización...');
try {
  const response = await fetch(ENDPOINT, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    console.error(`❌ Error ${response.status}: ${await response.text()}`);
  } else {
    const data = await response.json();
    console.log('✅ Estado actual:', JSON.stringify(data, null, 2));
  }
} catch (error) {
  console.error('❌ Error consultando estado:', error.message);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 2. CREAR UNA TRANSACCIÓN DE PRUEBA
console.log('2️⃣  Creando transacción de prueba...');
const testTransaction = {
  transactions: [
    {
      externalId: `test_${Date.now()}`,
      type: 'INGRESO',
      date: new Date().toISOString(),
      amount: 60.50,
      ivaRate: 21,
      description: 'Test de integración ALQUILOSCOOTER',
      documentType: 'NO APLICA',
      metadata: {
        source: 'TEST_SCRIPT',
        timestamp: new Date().toISOString()
      }
    }
  ]
};

console.log('📤 Enviando:', JSON.stringify(testTransaction, null, 2));

try {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testTransaction)
  });

  const responseText = await response.text();
  console.log(`\n📥 Status: ${response.status}`);
  console.log(`📥 Respuesta: ${responseText}`);

  if (response.ok) {
    const data = JSON.parse(responseText);
    console.log('\n✅ TRANSACCIÓN CREADA EXITOSAMENTE');
    console.log(`   - Procesadas: ${data.processed || 0}`);
    console.log(`   - Errores: ${data.errors || 0}`);
    if (data.results?.success?.length > 0) {
      console.log(`   - IDs exitosos: ${data.results.success.join(', ')}`);
    }
    if (data.results?.errors?.length > 0) {
      console.log(`   - Errores: ${JSON.stringify(data.results.errors)}`);
    }
  } else {
    console.error('\n❌ ERROR EN LA CREACIÓN');
  }
} catch (error) {
  console.error('❌ Error creando transacción:', error.message);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('✅ VERIFICACIÓN COMPLETADA\n');
