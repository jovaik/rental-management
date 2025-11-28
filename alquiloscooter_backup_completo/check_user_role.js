const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.car_rental_users.findUnique({
    where: { email: 'josemillanfdez@gmail.com' }
  });
  console.log('========================================');
  console.log('Usuario:', user?.email);
  console.log('Rol:', user?.role);
  console.log('========================================');
  await prisma.$disconnect();
}
check().catch(console.error);
