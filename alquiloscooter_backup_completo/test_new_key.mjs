import fetch from 'node-fetch';

const API_KEY = 'gs_69c6c837fac5c6ac12f40efcc44b55e9d2c97d61d3143933aa7390d14683d944';
const ENDPOINT = 'https://gscontrol.abacusai.app/api/integrations/sync';

console.log('🔍 VERIFICANDO NUEVA API KEY DE GSCONTROL\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 1. CONSULTAR ESTADO
console.log('1️⃣  Consultando estado de sincronización...');
try {
  const response = await fetch(ENDPOINT, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  console.log(`📥 Status: ${response.status}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Error: ${errorText}`);
  } else {
    const data = await response.json();
    console.log('✅ Estado actual:', JSON.stringify(data, null, 2));
  }
} catch (error) {
  console.error('❌ Error consultando estado:', error.message);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 2. CREAR TRANSACCIÓN DE PRUEBA
console.log('2️⃣  Creando transacción de prueba...');
const testTransaction = {
  transactions: [
    {
      externalId: `test_verificacion_${Date.now()}`,
      type: 'INGRESO',
      date: new Date().toISOString(),
      amount: 60.50,
      ivaRate: 21,
      description: 'Test de verificación ALQUILOSCOOTER - Nueva API Key',
      documentType: 'NO APLICA',
      metadata: {
        source: 'VERIFICACION_API_KEY',
        timestamp: new Date().toISOString()
      }
    }
  ]
};

console.log('📤 Enviando transacción...');

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

  if (response.ok) {
    const data = JSON.parse(responseText);
    console.log('\n✅ ¡ÉXITO! TRANSACCIÓN CREADA');
    console.log(`   - Procesadas: ${data.processed || 0}`);
    console.log(`   - Errores: ${data.errors || 0}`);
    if (data.results?.success?.length > 0) {
      console.log(`   - IDs exitosos: ${data.results.success.join(', ')}`);
    }
    if (data.results?.errors?.length > 0) {
      console.log(`   - Errores: ${JSON.stringify(data.results.errors)}`);
    }
    console.log('\n🎉 LA NUEVA API KEY FUNCIONA PERFECTAMENTE!\n');
  } else {
    console.error(`\n❌ ERROR: ${responseText}`);
  }
} catch (error) {
  console.error('❌ Error creando transacción:', error.message);
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
