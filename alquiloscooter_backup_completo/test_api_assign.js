require('dotenv').config();

async function testAPIAssignment() {
  try {
    console.log('========================================');
    console.log('TEST: API DE ASIGNACIÓN');
    console.log('========================================\n');

    // Usar el vehículo ID 2 que acabamos de actualizar
    const vehicleId = 2;
    const ownerId = 7; // Yami

    console.log(`📡 Haciendo petición PUT a /api/vehicles/${vehicleId}`);
    console.log(`   Asignando owner_user_id: ${ownerId}`);

    // Simular petición a la API (usando fetch interno de Node)
    const response = await fetch(`http://localhost:3000/api/vehicles/${vehicleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test' // Esto fallará por auth, pero veremos el error
      },
      body: JSON.stringify({
        owner_user_id: ownerId
      })
    });

    console.log(`   Status: ${response.status}`);
    
    const data = await response.json();
    console.log(`   Respuesta:`, JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPIAssignment();
