require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testEmailUpdate() {
  try {
    console.log('\n🔍 DIAGNÓSTICO: Cambio de Email en Usuarios\n');
    console.log('='.repeat(60));
    
    const users = await prisma.carRentalUsers.findMany({
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        role: true
      },
      orderBy: { id: 'asc' }
    });
    
    console.log('\n📋 Usuarios actuales en el sistema:\n');
    users.forEach(user => {
      console.log(`ID: ${user.id} | Email: ${user.email} | Nombre: ${user.firstname} ${user.lastname} | Rol: ${user.role}`);
    });
    
    console.log('\n\n🔎 Verificando emails duplicados...\n');
    const emailCounts = {};
    users.forEach(user => {
      const email = user.email.toLowerCase();
      emailCounts[email] = (emailCounts[email] || 0) + 1;
    });
    
    const duplicates = Object.entries(emailCounts).filter(([email, count]) => count > 1);
    if (duplicates.length > 0) {
      console.log('⚠️  EMAILS DUPLICADOS ENCONTRADOS:');
      duplicates.forEach(([email, count]) => {
        console.log(`   - ${email}: ${count} usuarios`);
      });
    } else {
      console.log('✅ No hay emails duplicados');
    }
    
    console.log('\n\n🔒 Verificando restricciones de la tabla...\n');
    const constraints = await prisma.$queryRaw`
      SELECT
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'car_rental_users'
        AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
    `;
    
    console.log('Restricciones encontradas:');
    constraints.forEach(c => {
      console.log(`   - ${c.constraint_type}: ${c.column_name} (${c.constraint_name})`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Diagnóstico completado\n');
    
  } catch (error) {
    console.error('❌ Error en el diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEmailUpdate();
