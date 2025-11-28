require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAssignment() {
  try {
    console.log('========================================');
    console.log('TEST: ASIGNACIÓN DE VEHÍCULOS A YAMI');
    console.log('========================================\n');

    // 1. Buscar a Yami en la base de datos
    console.log('1️⃣  Buscando usuario Yami...');
    const yami = await prisma.carRentalUsers.findFirst({
      where: {
        OR: [
          { firstname: { contains: 'Yami', mode: 'insensitive' } },
          { lastname: { contains: 'Yami', mode: 'insensitive' } },
          { email: { contains: 'yami', mode: 'insensitive' } }
        ]
      }
    });

    if (!yami) {
      console.log('❌ NO se encontró usuario Yami');
      console.log('\n📋 Listando todos los usuarios con rol propietario:');
      const propietarios = await prisma.carRentalUsers.findMany({
        where: { role: 'propietario' }
      });
      propietarios.forEach(p => {
        console.log(`   - ID: ${p.id}, Nombre: ${p.firstname} ${p.lastname}, Email: ${p.email}`);
      });
      return;
    }

    console.log(`✅ Usuario encontrado:`);
    console.log(`   ID: ${yami.id}`);
    console.log(`   Nombre: ${yami.firstname} ${yami.lastname}`);
    console.log(`   Email: ${yami.email}`);
    console.log(`   Rol: ${yami.role}`);
    console.log(`   Estado: ${yami.status}\n`);

    // 2. Listar vehículos actualmente asignados a Yami
    console.log('2️⃣  Vehículos actualmente asignados a Yami:');
    const vehiculosYami = await prisma.carRentalCars.findMany({
      where: {
        OR: [
          { owner_user_id: yami.id },
          { depositor_user_id: yami.id }
        ]
      },
      select: {
        id: true,
        registration_number: true,
        make: true,
        model: true,
        owner_user_id: true,
        depositor_user_id: true
      }
    });
    
    if (vehiculosYami.length === 0) {
      console.log('   ⚠️  No hay vehículos asignados a Yami');
    } else {
      vehiculosYami.forEach(v => {
        console.log(`   - ${v.registration_number} (${v.make} ${v.model})`);
        console.log(`     owner_user_id: ${v.owner_user_id}, depositor_user_id: ${v.depositor_user_id}`);
      });
    }

    // 3. Seleccionar un vehículo para prueba (el primero sin propietario)
    console.log('\n3️⃣  Seleccionando un vehículo para prueba...');
    const vehiculoTest = await prisma.carRentalCars.findFirst({
      where: {
        owner_user_id: null
      }
    });

    if (!vehiculoTest) {
      console.log('   ⚠️  No hay vehículos sin propietario para hacer la prueba');
      return;
    }

    console.log(`   Vehículo seleccionado: ${vehiculoTest.registration_number} (ID: ${vehiculoTest.id})`);
    console.log(`   Estado ANTES: owner_user_id = ${vehiculoTest.owner_user_id}`);

    // 4. Intentar asignar el vehículo a Yami
    console.log('\n4️⃣  Asignando vehículo a Yami...');
    const updated = await prisma.carRentalCars.update({
      where: { id: vehiculoTest.id },
      data: {
        owner_user_id: yami.id,
        updated_at: new Date()
      }
    });

    console.log(`   ✅ Actualización ejecutada`);
    console.log(`   Estado DESPUÉS: owner_user_id = ${updated.owner_user_id}`);

    // 5. Verificar que se guardó correctamente
    console.log('\n5️⃣  Verificando que se guardó correctamente...');
    const verificar = await prisma.carRentalCars.findUnique({
      where: { id: vehiculoTest.id },
      select: {
        id: true,
        registration_number: true,
        owner_user_id: true,
        depositor_user_id: true
      }
    });

    console.log(`   Verificación desde BD:`);
    console.log(`   - registration_number: ${verificar.registration_number}`);
    console.log(`   - owner_user_id: ${verificar.owner_user_id}`);
    console.log(`   - depositor_user_id: ${verificar.depositor_user_id}`);

    if (verificar.owner_user_id === yami.id) {
      console.log('\n✅ ¡ÉXITO! La asignación se guardó correctamente en la base de datos');
    } else {
      console.log('\n❌ ERROR: La asignación NO se guardó correctamente');
    }

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testAssignment();
