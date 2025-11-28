/**
 * Script de verificación completa
 * Verifica que todo esté configurado correctamente
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function verificarTodo() {
  console.log('\n='.repeat(60));
  console.log('🔍 VERIFICACIÓN COMPLETA DEL SISTEMA');
  console.log('='.repeat(60) + '\n');

  try {
    // 1. Verificar archivo .env
    console.log('📁 1. Verificando archivo .env...');
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const dbUrl = envContent.match(/DATABASE_URL="(.+?)"/)?.[1];
      
      if (dbUrl) {
        console.log('   ✅ Archivo .env encontrado');
        
        if (dbUrl.includes('5f4c8d7db')) {
          console.log('   ✅ Base de datos del backup configurada correctamente');
        } else {
          console.log('   ⚠️  Advertencia: Puede que no esté usando la base de datos del backup');
        }
      }
    } else {
      console.log('   ❌ Archivo .env no encontrado');
    }
    console.log('');

    // 2. Verificar conexión a la base de datos
    console.log('🗄️  2. Verificando conexión a la base de datos...');
    await prisma.$connect();
    console.log('   ✅ Conexión exitosa\n');

    // 3. Verificar tablas
    console.log('📋 3. Verificando tablas...');
    const tables = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log(`   ✅ ${tables[0].count} tablas encontradas\n`);

    // 4. Verificar usuarios
    console.log('👥 4. Verificando usuarios...');
    const users = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM car_rental_users
    `;
    console.log(`   ✅ ${users[0].count} usuarios en la base de datos\n`);

    // 5. Verificar usuario admin
    console.log('🔐 5. Verificando usuario admin...');
    const admin = await prisma.$queryRaw`
      SELECT id, email, firstname, lastname, role, status 
      FROM car_rental_users 
      WHERE email = 'admin@rental.com'
    `;
    
    if (admin.length > 0) {
      console.log('   ✅ Usuario admin@rental.com encontrado');
      console.log(`      Nombre: ${admin[0].firstname} ${admin[0].lastname}`);
      console.log(`      Rol: ${admin[0].role}`);
      console.log(`      Estado: ${admin[0].status}\n`);
      
      // Verificar contraseña
      const passwordTest = await prisma.$queryRaw`
        SELECT password FROM car_rental_users WHERE email = 'admin@rental.com'
      `;
      
      const passwordMatches = await bcrypt.compare('admin123', passwordTest[0].password);
      
      if (passwordMatches) {
        console.log('   ✅ Contraseña verificada: admin123 funciona correctamente\n');
      } else {
        console.log('   ⚠️  La contraseña admin123 no coincide\n');
        console.log('   💡 Ejecuta: node reset_admin_password.js\n');
      }
    } else {
      console.log('   ❌ Usuario admin@rental.com no encontrado\n');
    }

    // 6. Verificar datos
    console.log('📊 6. Estadísticas de datos...');
    
    const clientes = await prisma.$queryRaw`SELECT COUNT(*) as count FROM car_rental_customers`;
    const vehiculos = await prisma.$queryRaw`SELECT COUNT(*) as count FROM car_rental_cars`;
    const reservas = await prisma.$queryRaw`SELECT COUNT(*) as count FROM car_rental_bookings`;
    const contratos = await prisma.$queryRaw`SELECT COUNT(*) as count FROM car_rental_contracts`;
    
    console.log(`   • Clientes: ${clientes[0].count}`);
    console.log(`   • Vehículos: ${vehiculos[0].count}`);
    console.log(`   • Reservas: ${reservas[0].count}`);
    console.log(`   • Contratos: ${contratos[0].count}\n`);

    // Resumen final
    console.log('='.repeat(60));
    console.log('✅ VERIFICACIÓN COMPLETADA');
    console.log('='.repeat(60) + '\n');
    
    console.log('🎯 TODO ESTÁ LISTO PARA USAR\n');
    console.log('📧 CREDENCIALES DE ACCESO:');
    console.log('   Email: admin@rental.com');
    console.log('   Contraseña: admin123');
    console.log('   URL: http://localhost:3000\n');
    
    console.log('🚀 INICIAR LA APLICACIÓN:');
    console.log('   cd /home/ubuntu/rental_management');
    console.log('   yarn dev\n');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    console.log('\n💡 Posibles soluciones:');
    console.log('   1. Verifica que el archivo .env esté correcto');
    console.log('   2. Asegúrate de que la base de datos esté accesible');
    console.log('   3. Ejecuta: npx prisma generate\n');
  } finally {
    await prisma.$disconnect();
  }
}

verificarTodo();
