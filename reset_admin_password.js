/**
 * Script para resetear la contraseña del administrador
 * Uso: node reset_admin_password.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log('🔐 Reseteando contraseña del administrador...\n');
    
    // Configuración
    const email = 'admin@rental.com';
    const newPassword = 'admin123';
    
    // Verificar que el usuario existe
    const userCheck = await prisma.$queryRaw`
      SELECT id, email, firstname, lastname, role 
      FROM car_rental_users 
      WHERE email = ${email}
    `;
    
    if (userCheck.length === 0) {
      console.log(`❌ Error: Usuario ${email} no encontrado en la base de datos\n`);
      console.log('📋 Usuarios disponibles:');
      
      const allUsers = await prisma.$queryRaw`
        SELECT email, firstname, lastname, role 
        FROM car_rental_users 
        ORDER BY id
      `;
      
      allUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.role})`);
      });
      
      console.log('\n💡 Edita este script y cambia la variable "email" por uno de los usuarios listados.');
      await prisma.$disconnect();
      return;
    }
    
    console.log(`✅ Usuario encontrado: ${userCheck[0].firstname} ${userCheck[0].lastname}`);
    console.log(`   Email: ${email}`);
    console.log(`   Rol: ${userCheck[0].role}\n`);
    
    // Hashear la nueva contraseña
    console.log('🔒 Hasheando nueva contraseña...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar la contraseña
    await prisma.$queryRaw`
      UPDATE car_rental_users 
      SET password = ${hashedPassword} 
      WHERE email = ${email}
    `;
    
    console.log('✅ Contraseña actualizada exitosamente\n');
    console.log('📧 Credenciales de acceso:');
    console.log(`   Email: ${email}`);
    console.log(`   Contraseña: ${newPassword}\n`);
    console.log('🌐 Puedes iniciar sesión en: http://localhost:3000\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
resetAdminPassword();
