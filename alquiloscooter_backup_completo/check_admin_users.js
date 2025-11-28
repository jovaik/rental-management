const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmins() {
  try {
    const admins = await prisma.carRentalUsers.findMany({
      where: {
        OR: [
          { role: 'super_admin' },
          { role: 'admin' }
        ]
      },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        role: true
      }
    });
    
    console.log("=== USUARIOS ADMIN/SUPER_ADMIN ===");
    admins.forEach(u => {
      console.log(`ID: ${u.id}`);
      console.log(`Email: ${u.email}`);
      console.log(`Nombre: ${u.firstname} ${u.lastname}`);
      console.log(`Rol: ${u.role}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmins();
