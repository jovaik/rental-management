import fetch from 'node-fetch';

const API_KEY = 'gs_69c6c837fac5c6ac12f40efcc44b55e9d2c97d61d3143933aa7390d14683d944';
const ENDPOINT = 'https://gscontrol.abacusai.app/api/integrations/sync';

console.log('🔍 DIAGNÓSTICO DE SINCRONIZACIÓN GSCONTROL\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Probar diferentes escenarios
const scenarios = [
  {
    name: 'Escenario 1: Transacción básica',
    data: {
      transactions: [
        {
          externalId: `test_${Date.now()}`,
          type: 'INGRESO',
          date: new Date().toISOString(),
          amount: 100,
          ivaRate: 21,
          description: 'Test básico',
          documentType: 'NO APLICA'
        }
      ]
    }
  },
  {
    name: 'Escenario 2: Con cliente',
    data: {
      transactions: [
        {
          externalId: `test_cliente_${Date.now()}`,
          type: 'INGRESO',
          date: new Date().toISOString(),
          amount: 100,
          ivaRate: 21,
          description: 'Test con cliente',
          documentType: 'NO APLICA',
          clientName: 'Juan Pérez',
          clientDni: '12345678A'
        }
      ]
    }
  },
  {
    name: 'Escenario 3: Con metadata',
    data: {
      transactions: [
        {
          externalId: `test_metadata_${Date.now()}`,
          type: 'INGRESO',
          date: new Date().toISOString(),
          amount: 100,
          ivaRate: 21,
          description: 'Test con metadata',
          documentType: 'NO APLICA',
          metadata: {
            bookingId: 123,
            source: 'TEST'
          }
        }
      ]
    }
  },
  {
    name: 'Escenario 4: Completo',
    data: {
      transactions: [
        {
          externalId: `test_completo_${Date.now()}`,
          type: 'INGRESO',
          date: new Date().toISOString(),
          amount: 100,
          ivaRate: 21,
          description: 'Test completo',
          documentType: 'NO APLICA',
          clientName: 'Juan Pérez',
          clientDni: '12345678A',
          metadata: {
            bookingId: 123,
            customerId: 456,
            vehicleId: 789,
            source: 'ALQUILOSCOOTER'
          }
        }
      ]
    }
  }
];

for (const scenario of scenarios) {
  console.log(`\n📋 ${scenario.name}`);
  console.log('─────────────────────────────────────────\n');
  console.log('📤 Enviando:', JSON.stringify(scenario.data, null, 2));
  
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(scenario.data)
    });

    const result = await response.json();
    console.log('\n📥 Respuesta:', JSON.stringify(result, null, 2));
    console.log(`\n📊 Status: ${response.status}`);
    console.log(`✅ Procesadas: ${result.processed || 0}`);
    console.log(`❌ Errores: ${result.errors || 0}`);
    console.log(`🎯 Exitosas: ${result.results?.success?.length || 0}`);
    
    if (result.results?.errors?.length > 0) {
      console.log('\n❌ Errores encontrados:');
      result.results.errors.forEach((err, i) => {
        console.log(`   ${i+1}. ${JSON.stringify(err)}`);
      });
    }
    
    if (result.results?.success?.length > 0) {
      console.log('\n✅ IDs exitosos:');
      result.results.success.forEach((id, i) => {
        console.log(`   ${i+1}. ${id}`);
      });
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Esperar 1 segundo entre pruebas
    await new Promise(resolve => setTimeout(resolve, 1000));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Al final, consultar el estado
console.log('\n\n🔍 CONSULTANDO ESTADO FINAL...\n');
try {
  const response = await fetch(ENDPOINT, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  console.log('📊 Estado actual:', JSON.stringify(data, null, 2));
} catch (error) {
  console.error('❌ Error consultando estado:', error.message);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
