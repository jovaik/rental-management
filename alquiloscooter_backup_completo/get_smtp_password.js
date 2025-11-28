require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getPassword() {
  try {
    const config = await prisma.companyConfig.findFirst({
      where: { active: true }
    });
    if (config && config.smtp_password) {
      console.log('Contraseña SMTP completa:', config.smtp_password);
    } else {
      console.log('No se encontró contraseña');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getPassword();
