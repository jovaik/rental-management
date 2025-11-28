const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkYami() {
  try {
    console.log('\n🔍 Buscando usuario "Yami"...\n');
    
    // Buscar usuarios que contengan "Yami" en nombre o email
    const users = await prisma.carRentalUsers.findMany({
      where: {
        OR: [
          { firstname: { contains: 'Yami', mode: 'insensitive' } },
          { lastname: { contains: 'Yami', mode: 'insensitive' } },
          { email: { contains: 'yami', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        role: true,
        status: true
      }
    });
    
    if (users.length === 0) {
      console.log('❌ No se encontró ningún usuario con "Yami" en su nombre o email\n');
    } else {
      console.log(`✅ Se encontraron ${users.length} usuario(s):\n`);
      users.forEach(user => {
        console.log(`  ID: ${user.id}`);
        console.log(`  Nombre: ${user.firstname} ${user.lastname}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Rol: ${user.role}`);
        console.log(`  Estado: ${user.status}`);
        console.log(`  ${'='.repeat(50)}\n`);
      });
    }
    
    // Mostrar todos los propietarios disponibles
    console.log('\n📋 Propietarios activos en el sistema:\n');
    const owners = await prisma.carRentalUsers.findMany({
      where: {
        role: 'propietario',
        status: 'T'
      },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true
      },
      orderBy: {
        firstname: 'asc'
      }
    });
    
    if (owners.length === 0) {
      console.log('❌ No hay propietarios activos en el sistema\n');
    } else {
      console.log(`✅ ${owners.length} propietario(s) activo(s):\n`);
      owners.forEach(owner => {
        console.log(`  ${owner.firstname} ${owner.lastname} (${owner.email})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkYami();
