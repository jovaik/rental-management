import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { subdomain: 'demo' },
    update: {},
    create: {
      name: 'Demo Rental Company',
      subdomain: 'demo',
      businessTypes: ['SCOOTER_RENTAL'],
      colors: {
        primary: '#3B82F6',
        secondary: '#1E40AF',
      },
      config: {
        currency: 'EUR',
        timezone: 'Europe/Madrid',
      },
    },
  });

  console.log('✅ Created demo tenant:', demoTenant.subdomain);

  // Create owner user for demo tenant
  const hashedPassword = await hash('password123', 12);

  const ownerUser = await prisma.user.create({
    data: {
      email: 'owner@demo.com',
      name: 'Demo Owner',
      password: hashedPassword,
      role: 'OWNER',
      tenantId: demoTenant.id,
    },
  });

  console.log('✅ Created owner user:', ownerUser.email);

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      name: 'Demo Admin',
      password: hashedPassword,
      role: 'ADMIN',
      tenantId: demoTenant.id,
    },
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create operator user
  const operatorUser = await prisma.user.create({
    data: {
      email: 'operator@demo.com',
      name: 'Demo Operator',
      password: hashedPassword,
      role: 'OPERATOR',
      tenantId: demoTenant.id,
    },
  });

  console.log('✅ Created operator user:', operatorUser.email);

  // Create second tenant for testing isolation
  const testTenant = await prisma.tenant.upsert({
    where: { subdomain: 'test' },
    update: {},
    create: {
      name: 'Test Company',
      subdomain: 'test',
      businessTypes: ['VEHICLE_RENTAL'],
      colors: {
        primary: '#10B981',
        secondary: '#059669',
      },
      config: {
        currency: 'USD',
        timezone: 'America/New_York',
      },
    },
  });

  console.log('✅ Created test tenant:', testTenant.subdomain);

  // Create owner for test tenant
  const testOwner = await prisma.user.create({
    data: {
      email: 'owner@test.com',
      name: 'Test Owner',
      password: hashedPassword,
      role: 'OWNER',
      tenantId: testTenant.id,
    },
  });

  console.log('✅ Created test owner user:', testOwner.email);

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('   Demo Tenant (subdomain: demo):');
  console.log('     - owner@demo.com / password123 (OWNER)');
  console.log('     - admin@demo.com / password123 (ADMIN)');
  console.log('     - operator@demo.com / password123 (OPERATOR)');
  console.log('\n   Test Tenant (subdomain: test):');
  console.log('     - owner@test.com / password123 (OWNER)');
  console.log('\n💡 To test locally:');
  console.log('   1. Add to /etc/hosts: 127.0.0.1 demo.localhost test.localhost');
  console.log('   2. Visit: http://demo.localhost:3000');
  console.log('   3. Login with any of the above credentials');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
