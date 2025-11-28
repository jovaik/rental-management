require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const user = await prisma.carRentalUsers.findUnique({
      where: { email: 'josemillanfdez@gmail.com' }
    });
    
    console.log('\n========================================');
    console.log('Usuario:', user?.email || 'NO ENCONTRADO');
    console.log('Nombre:', user?.firstname, user?.lastname);
    console.log('Rol:', user?.role);
    console.log('Es super_admin?', user?.role === 'super_admin');
    console.log('========================================\n');
    
    // Verificar si hay propietarios
    const owners = await prisma.carRentalUsers.findMany({
      where: {
        OR: [
          { role: 'propietario' },
          { role: 'owner' }
        ]
      }
    });
    
    console.log('Propietarios en BD:', owners.length);
    if (owners.length > 0) {
      owners.forEach(o => {
        console.log('-', o.email, '(rol:', o.role + ')');
      });
    } else {
      console.log('❌ NO HAY PROPIETARIOS EN LA BD - Por eso no se muestra el filtro');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
