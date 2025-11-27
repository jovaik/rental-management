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

  // Create sample items for demo tenant
  await prisma.item.createMany({
    data: [
      {
        tenantId: demoTenant.id,
        type: 'VEHICLE',
        name: 'Honda PCX 125',
        description: 'Comfortable and reliable scooter for city tours',
        basePrice: 30.00,
        status: 'AVAILABLE',
        attributes: {
          licensePlate: '1234-ABC',
          model: 'Honda PCX 125',
          year: 2023,
          mileage: 5000,
          fuelType: 'gasoline',
          transmission: 'automatic',
        },
        photos: ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=400'],
      },
      {
        tenantId: demoTenant.id,
        type: 'VEHICLE',
        name: 'Yamaha NMAX 125',
        description: 'Sporty and efficient scooter with modern design',
        basePrice: 28.00,
        status: 'AVAILABLE',
        attributes: {
          licensePlate: '5678-DEF',
          model: 'Yamaha NMAX 125',
          year: 2023,
          mileage: 3500,
          fuelType: 'gasoline',
          transmission: 'automatic',
        },
        photos: ['https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400'],
      },
      {
        tenantId: demoTenant.id,
        type: 'VEHICLE',
        name: 'Vespa Primavera 150',
        description: 'Classic Italian style meets modern performance',
        basePrice: 35.00,
        status: 'RENTED',
        attributes: {
          licensePlate: '9012-GHI',
          model: 'Vespa Primavera 150',
          year: 2022,
          mileage: 8000,
          fuelType: 'gasoline',
          transmission: 'automatic',
        },
        photos: ['https://images.unsplash.com/photo-1558981852-426c6c22a060?w=400'],
      },
      {
        tenantId: demoTenant.id,
        type: 'VEHICLE',
        name: 'Piaggio Liberty 125',
        description: 'Lightweight and easy to ride, perfect for beginners',
        basePrice: 25.00,
        status: 'MAINTENANCE',
        attributes: {
          licensePlate: '3456-JKL',
          model: 'Piaggio Liberty 125',
          year: 2021,
          mileage: 12000,
          fuelType: 'gasoline',
          transmission: 'automatic',
        },
        photos: ['https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400'],
      },
    ],
  });

  console.log('✅ Created sample items for demo tenant');

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

  // Create "Scooters Madrid" tenant
  const scootersMadridTenant = await prisma.tenant.upsert({
    where: { subdomain: 'scooters-madrid' },
    update: {},
    create: {
      name: 'Scooters Madrid',
      subdomain: 'scooters-madrid',
      businessTypes: ['VEHICLE_RENTAL', 'SCOOTER_RENTAL'],
      location: 'Madrid',
      colors: {
        primary: '#EF4444',
        secondary: '#DC2626',
      },
      config: {
        currency: 'EUR',
        timezone: 'Europe/Madrid',
      },
    },
  });

  console.log('✅ Created Scooters Madrid tenant:', scootersMadridTenant.subdomain);

  // Create owner for Scooters Madrid
  const scootersMadridOwner = await prisma.user.create({
    data: {
      email: 'admin@scooters-madrid.com',
      name: 'Carlos García',
      password: hashedPassword,
      role: 'OWNER',
      tenantId: scootersMadridTenant.id,
    },
  });

  console.log('✅ Created Scooters Madrid owner:', scootersMadridOwner.email);

  // Create sample items for Scooters Madrid
  await prisma.item.createMany({
    data: [
      {
        tenantId: scootersMadridTenant.id,
        type: 'VEHICLE',
        name: 'Electric Scooter Pro',
        description: 'High-performance electric scooter with 50km range',
        basePrice: 25.00,
        status: 'AVAILABLE',
        attributes: {
          licensePlate: 'MAD-E001',
          model: 'Xiaomi Mi Pro 2',
          year: 2023,
          mileage: 150,
          fuelType: 'electric',
          transmission: 'automatic',
        },
        photos: ['https://images.unsplash.com/photo-1598986646512-9330bcc4c0dc?w=400'],
      },
      {
        tenantId: scootersMadridTenant.id,
        type: 'VEHICLE',
        name: 'City Scooter Classic',
        description: 'Perfect for city rides, easy to handle',
        basePrice: 18.00,
        status: 'AVAILABLE',
        attributes: {
          licensePlate: 'MAD-E002',
          model: 'Segway Ninebot E22',
          year: 2023,
          mileage: 220,
          fuelType: 'electric',
          transmission: 'automatic',
        },
        photos: ['https://images.unsplash.com/photo-1559564484-e48c1b8d69f8?w=400'],
      },
    ],
  });

  console.log('✅ Created sample items for Scooters Madrid');

  // Create "Boats Marbella" tenant
  const boatsMarbellatenant = await prisma.tenant.upsert({
    where: { subdomain: 'boats-marbella' },
    update: {},
    create: {
      name: 'Boats Marbella',
      subdomain: 'boats-marbella',
      businessTypes: ['BOAT_RENTAL'],
      location: 'Marbella',
      colors: {
        primary: '#3B82F6',
        secondary: '#2563EB',
      },
      config: {
        currency: 'EUR',
        timezone: 'Europe/Madrid',
        publishToMarbella4Rent: true,
      },
    },
  });

  console.log('✅ Created Boats Marbella tenant:', boatsMarbellatenant.subdomain);

  // Create owner for Boats Marbella
  const boatsMarbellaOwner = await prisma.user.create({
    data: {
      email: 'info@boats-marbella.com',
      name: 'Marina López',
      password: hashedPassword,
      role: 'OWNER',
      tenantId: boatsMarbellatenant.id,
    },
  });

  console.log('✅ Created Boats Marbella owner:', boatsMarbellaOwner.email);

  // Create sample items for Boats Marbella
  await prisma.item.createMany({
    data: [
      {
        tenantId: boatsMarbellatenant.id,
        type: 'BOAT',
        name: 'Luxury Yacht Azimut 50',
        description: 'Luxurious yacht perfect for coastal cruising',
        basePrice: 800.00,
        status: 'AVAILABLE',
        attributes: {
          length: '50 ft',
          capacity: '12 passengers',
          cabins: '3',
          crew: 'Included',
        },
        photos: ['https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=400'],
      },
      {
        tenantId: boatsMarbellatenant.id,
        type: 'BOAT',
        name: 'Speedboat Sunseeker',
        description: 'Fast and sporty speedboat for adventure seekers',
        basePrice: 450.00,
        status: 'AVAILABLE',
        attributes: {
          length: '30 ft',
          capacity: '8 passengers',
          maxSpeed: '45 knots',
        },
        photos: ['https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?w=400'],
      },
      {
        tenantId: boatsMarbellatenant.id,
        type: 'BOAT',
        name: 'Sailboat Beneteau Oceanis',
        description: 'Classic sailboat for a peaceful sailing experience',
        basePrice: 350.00,
        status: 'AVAILABLE',
        attributes: {
          length: '38 ft',
          capacity: '6 passengers',
          cabins: '2',
          sails: 'Full set',
        },
        photos: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400'],
      },
    ],
  });

  console.log('✅ Created sample items for Boats Marbella');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('   Demo Tenant (subdomain: demo):');
  console.log('     - owner@demo.com / password123 (OWNER)');
  console.log('     - admin@demo.com / password123 (ADMIN)');
  console.log('     - operator@demo.com / password123 (OPERATOR)');
  console.log('\n   Test Tenant (subdomain: test):');
  console.log('     - owner@test.com / password123 (OWNER)');
  console.log('\n   Scooters Madrid (subdomain: scooters-madrid):');
  console.log('     - admin@scooters-madrid.com / password123 (OWNER)');
  console.log('     - 2 sample scooters available');
  console.log('\n   Boats Marbella (subdomain: boats-marbella):');
  console.log('     - info@boats-marbella.com / password123 (OWNER)');
  console.log('     - 3 sample boats available');
  console.log('     - Published to Marbella4Rent marketplace');
  console.log('\n💡 To test locally:');
  console.log('   1. Add to /etc/hosts:');
  console.log('      127.0.0.1 demo.localhost test.localhost scooters-madrid.localhost boats-marbella.localhost');
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
