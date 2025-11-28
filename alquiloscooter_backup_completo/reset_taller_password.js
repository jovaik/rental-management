require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetPassword() {
  try {
    const newPassword = 'taller123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.carRentalUsers.update({
      where: { email: 'taller@oscar.es' },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Contraseña actualizada');
    console.log('Email: taller@oscar.es');
    console.log('Contraseña: taller123');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
