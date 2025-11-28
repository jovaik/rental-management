const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('📊 VERIFICANDO BASE DE DATOS CORRECTA (db-43c1c84ad)\n');
  
  const tenants = await prisma.tenant.findMany({ select: { subdomain: true, name: true, id: true } });
  console.log('✅ TENANTS CREADOS:');
  tenants.forEach(t => console.log(`   - ${t.subdomain}: ${t.name}`));
  
  console.log('\n✅ USUARIOS POR TENANT:');
  for (const tenant of tenants) {
    const users = await prisma.user.findMany({
      where: { tenantId: tenant.id },
      select: { email: true, role: true }
    });
    console.log(`\n   ${tenant.subdomain}:`);
    users.forEach(u => console.log(`     - ${u.email} (${u.role})`));
  }
  
  await prisma.$disconnect();
}

verify().catch(console.error);
