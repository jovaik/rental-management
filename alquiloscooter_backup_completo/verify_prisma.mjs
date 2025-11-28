import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true
      }
    });
    
    console.log('\n=== USUARIOS ACTUALES ===\n');
    users.forEach(u => {
      console.log(`Email: ${u.email}`);
      console.log(`Nombre: ${u.name || 'N/A'}`);
      console.log(`Rol: ${u.role}`);
      console.log(`Última actualización: ${u.updatedAt}`);
      console.log('---\n');
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
