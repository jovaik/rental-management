require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: { 
        email: true, 
        role: true,
        first_name: true,
        last_name: true
      },
      orderBy: { email: 'asc' }
    });
    
    console.log('\n=== USUARIOS EN PRODUCCIÓN ===\n');
    users.forEach(u => {
      console.log(`📧 ${u.email}`);
      console.log(`   👤 ${u.first_name || ''} ${u.last_name || ''}`);
      console.log(`   🔑 ${u.role}\n`);
    });
    console.log(`Total: ${users.length} usuarios\n`);
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
