require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCompanyConfig() {
  try {
    const config = await prisma.companyConfig.findFirst({
      where: { active: true }
    });
    if (config) {
      console.log('✅ Configuración de empresa encontrada:');
      console.log('  smtp_host:', config.smtp_host || 'NO CONFIGURADO');
      console.log('  smtp_port:', config.smtp_port || 'NO CONFIGURADO');
      console.log('  smtp_user:', config.smtp_user || 'NO CONFIGURADO');
      console.log('  smtp_password:', config.smtp_password ? '***' + config.smtp_password.slice(-4) : 'NO CONFIGURADO');
      console.log('  smtp_from:', config.smtp_from || 'NO CONFIGURADO');
      console.log('  admin_email:', config.admin_email || 'NO CONFIGURADO');
    } else {
      console.log('❌ No hay configuración de empresa activa');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCompanyConfig();
