const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAvailability() {
  console.log('🔍 DIAGNÓSTICO DEFINITIVO: N 56 6933NGT\n');
  
  const vehicle = await prisma.carRentalCars.findUnique({
    where: { id: 99 }
  });
  
  console.log('✅ Vehículo:', vehicle.registration_number, `(ID: ${vehicle.id})`);
  
  console.log('\n📅 Reserva EXISTENTE (debe bloquear disponibilidad):');
  console.log('Del 20-27 Nov 2025, Status: confirmed');
  
  const existing = await prisma.carRentalBookings.findUnique({
    where: { id: 151 }
  });
  
  console.log('Confirmado en DB:');
  console.log('  Pickup:', existing.pickup_date.toISOString().split('T')[0]);
  console.log('  Return:', existing.return_date.toISOString().split('T')[0]);
  console.log('  Status:', existing.status);
  console.log('  car_id:', existing.car_id);
  
  // Simular nueva reserva 22-30 Nov 2025
  console.log('\n🔬 SIMULACIÓN: Nueva reserva 22-30 Nov 2025');
  
  const nov22_2025 = new Date('2025-11-22T10:00:00');
  const nov30_2025 = new Date('2025-11-30T10:00:00');
  
  console.log('Pickup nueva:', nov22_2025.toISOString().split('T')[0]);
  console.log('Return nueva:', nov30_2025.toISOString().split('T')[0]);
  
  console.log('\n🔍 Ejecutando query de validación...');
  
  const overlapping = await prisma.carRentalBookings.findMany({
    where: {
      status: { in: ['confirmed', 'pending', 'active'] },
      OR: [
        {
          car_id: vehicle.id,
          AND: [
            { pickup_date: { lt: nov30_2025 } },
            { return_date: { gt: nov22_2025 } }
          ]
        },
        {
          vehicles: {
            some: { car_id: vehicle.id }
          },
          AND: [
            { pickup_date: { lt: nov30_2025 } },
            { return_date: { gt: nov22_2025 } }
          ]
        }
      ]
    }
  });
  
  console.log(`\n📊 Resultado: ${overlapping.length} conflictos detectados`);
  
  if (overlapping.length > 0) {
    console.log('\n✅ ✅ ✅ CORRECTO: Debería RECHAZAR la reserva');
    overlapping.forEach(b => {
      console.log(`\n  Conflicto con Reserva #${b.id}:`);
      console.log(`    Status: ${b.status}`);
      console.log(`    Pickup: ${b.pickup_date.toISOString().split('T')[0]}`);
      console.log(`    Return: ${b.return_date.toISOString().split('T')[0]}`);
      console.log(`    car_id: ${b.car_id}`);
    });
  } else {
    console.log('\n❌ ❌ ❌ ERROR CRÍTICO: No detectó conflicto');
    console.log('La nueva reserva (22-30) se solaparía con la existente (20-27)');
    console.log('Pero el sistema NO está detectando el conflicto.');
  }
  
  // Verificar lógica manual
  console.log('\n\n🧮 Verificación MANUAL de la fórmula:');
  console.log('Fórmula: pickup_nueva < return_existente AND return_nueva > pickup_existente');
  console.log(`  ${nov22_2025.toISOString().split('T')[0]} < ${existing.return_date.toISOString().split('T')[0]} = ${nov22_2025 < existing.return_date}`);
  console.log(`  ${nov30_2025.toISOString().split('T')[0]} > ${existing.pickup_date.toISOString().split('T')[0]} = ${nov30_2025 > existing.pickup_date}`);
  console.log(`  Ambas condiciones TRUE = ${nov22_2025 < existing.return_date && nov30_2025 > existing.pickup_date}`);
  console.log(`  ¿Debería detectar conflicto? ${nov22_2025 < existing.return_date && nov30_2025 > existing.pickup_date ? 'SÍ' : 'NO'}`);
  
  await prisma.$disconnect();
}

testAvailability().catch(console.error);
