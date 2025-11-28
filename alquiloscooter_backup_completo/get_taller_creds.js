require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getCreds() {
  try {
    const user = await prisma.carRentalUsers.findUnique({
      where: { email: 'taller@oscar.es' }
    });
    
    if (user) {
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('Password hash exists:', !!user.password);
    } else {
      console.log('Usuario no encontrado');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getCreds();
