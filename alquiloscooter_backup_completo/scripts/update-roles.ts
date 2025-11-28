
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔄 Actualizando sistema de roles...\n');

    // Convertir admin@rental.com en super_admin
    const superAdmin = await prisma.carRentalUsers.update({
      where: { email: 'admin@rental.com' },
      data: { role: 'super_admin' }
    });
    console.log('✅ Super Admin creado:', superAdmin.email);

    // Convertir otros admins en admin
    await prisma.carRentalUsers.updateMany({
      where: { 
        email: { not: 'admin@rental.com' },
        role: 'admin' 
      },
      data: { role: 'admin' }
    });
    console.log('✅ Admins actualizados');

    // Convertir users en operators
    await prisma.carRentalUsers.updateMany({
      where: { role: 'user' },
      data: { role: 'operator' }
    });
    console.log('✅ Operadores actualizados');

    // Mostrar usuarios actualizados
    const users = await prisma.carRentalUsers.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true
      },
      orderBy: { id: 'asc' }
    });

    console.log('\n📋 Usuarios después de la actualización:');
    console.table(users);

    console.log('\n🔐 Credenciales de Super Admin:');
    console.log('Email: admin@rental.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
