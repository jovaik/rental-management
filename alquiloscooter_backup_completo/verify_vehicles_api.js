require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyVehiclesAPI() {
  try {
    console.log('========================================');
    console.log('TEST: VERIFICACIÓN API /api/vehicles/all');
    console.log('========================================\n');

    // Consultar directamente los vehículos como lo haría la API
    console.log('📋 Consultando vehículos desde la BD...');
    const vehicles = await prisma.carRentalCars.findMany({
      orderBy: { registration_number: 'asc' },
      select: {
        id: true,
        registration_number: true,
        make: true,
        model: true,
        owner_user_id: true,
        depositor_user_id: true,
        status: true
      }
    });

    console.log(`✅ Total de vehículos: ${vehicles.length}\n`);

    // Mostrar solo los primeros 5 para verificar
    console.log('📊 Primeros 5 vehículos:');
    vehicles.slice(0, 5).forEach((v, i) => {
      console.log(`${i+1}. ${v.registration_number} - Owner: ${v.owner_user_id}, Depositor: ${v.depositor_user_id}`);
    });

    // Verificar el vehículo que asignamos antes
    console.log('\n🔍 Verificando vehículo ID 2 (el que asignamos a Yami)...');
    const vehiculo2 = vehicles.find(v => v.id === 2);
    if (vehiculo2) {
      console.log(`   ✅ Encontrado: ${vehiculo2.registration_number}`);
      console.log(`   owner_user_id: ${vehiculo2.owner_user_id} ${vehiculo2.owner_user_id === 7 ? '✓ (Yami)' : '✗'}`);
    } else {
      console.log(`   ❌ No encontrado`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyVehiclesAPI();
