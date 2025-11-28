const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserRoles() {
  console.log('\n====== VERIFICACIÓN DE ROLES DE USUARIOS ======\n');
  
  try {
    const allUsers = await prisma.carRentalUsers.findMany({
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        role: true,
        status: true
      },
      orderBy: {
        role: 'asc'
      }
    });
    
    console.log(`Total de usuarios: ${allUsers.length}\n`);
    
    // Agrupar por rol
    const byRole = {};
    allUsers.forEach(user => {
      if (!byRole[user.role]) {
        byRole[user.role] = [];
      }
      byRole[user.role].push(user);
    });
    
    Object.keys(byRole).sort().forEach(role => {
      console.log(`\n🏷️  ROL: ${role}`);
      console.log(`   Total: ${byRole[role].length}`);
      byRole[role].forEach(user => {
        const statusIcon = user.status === 'T' ? '✅' : '❌';
        console.log(`   ${statusIcon} ID: ${user.id}, ${user.firstname} ${user.lastname} (${user.email}) - Estado: ${user.status}`);
      });
    });
    
  } catch (error) {
    console.error('❌ ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRoles();
