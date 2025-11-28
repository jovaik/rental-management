import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  const now = new Date();

  // Create demo tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { subdomain: 'demo' },
    update: {},
    create: {
      id: randomUUID(),
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
      updatedAt: now,
    },
  });

  console.log('✅ Created demo tenant:', demoTenant.subdomain);

  // Create owner user for demo tenant
  const hashedPassword = await hash('password123', 12);

  const ownerUser = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: 'owner@demo.com',
      name: 'Demo Owner',
      password: hashedPassword,
      role: 'OWNER',
      tenantId: demoTenant.id,
      updatedAt: now,
    },
  });

  console.log('✅ Created owner user:', ownerUser.email);

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: 'admin@demo.com',
      name: 'Demo Admin',
      password: hashedPassword,
      role: 'ADMIN',
      tenantId: demoTenant.id,
      updatedAt: now,
    },
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create operator user
  const operatorUser = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: 'operator@demo.com',
      name: 'Demo Operator',
      password: hashedPassword,
      role: 'OPERATOR',
      tenantId: demoTenant.id,
      updatedAt: now,
    },
  });

  console.log('✅ Created operator user:', operatorUser.email);

  // Create sample items for demo tenant
  const items = [
    {
      id: randomUUID(),
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
      updatedAt: now,
    },
    {
      id: randomUUID(),
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
      updatedAt: now,
    },
    {
      id: randomUUID(),
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
      updatedAt: now,
    },
    {
      id: randomUUID(),
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
      updatedAt: now,
    },
  ];

  await prisma.item.createMany({ data: items });
  console.log('✅ Created sample items for demo tenant');

  // Create sample customers for demo tenant
  const customers = [
    {
      id: randomUUID(),
      tenantId: demoTenant.id,
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '+34 600 111 222',
      documentType: 'PASSPORT',
      documentNumber: 'AB123456',
      address: 'Calle Mayor 10',
      city: 'Madrid',
      country: 'Spain',
      updatedAt: now,
    },
    {
      id: randomUUID(),
      tenantId: demoTenant.id,
      name: 'Maria García',
      email: 'maria.garcia@example.com',
      phone: '+34 600 333 444',
      documentType: 'DNI',
      documentNumber: '12345678X',
      address: 'Gran Vía 25',
      city: 'Madrid',
      country: 'Spain',
      updatedAt: now,
    },
    {
      id: randomUUID(),
      tenantId: demoTenant.id,
      name: 'Pierre Dubois',
      email: 'pierre.dubois@example.com',
      phone: '+33 6 12 34 56 78',
      documentType: 'PASSPORT',
      documentNumber: 'FR987654',
      address: 'Rue de la Paix 15',
      city: 'Paris',
      country: 'France',
      updatedAt: now,
    },
    {
      id: randomUUID(),
      tenantId: demoTenant.id,
      name: 'Emma Wilson',
      email: 'emma.wilson@example.com',
      phone: '+44 7700 900123',
      documentType: 'DRIVING_LICENSE',
      documentNumber: 'UK123456789',
      address: 'Oxford Street 50',
      city: 'London',
      country: 'United Kingdom',
      updatedAt: now,
    },
  ];

  await prisma.customer.createMany({ data: customers });
  console.log('✅ Created sample customers for demo tenant');

  // Create sample bookings for demo tenant
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const bookings = [
    {
      id: randomUUID(),
      tenantId: demoTenant.id,
      itemId: items[0].id,
      customerId: customers[0].id,
      startDate: lastMonth,
      endDate: yesterday,
      totalPrice: 150.00,
      deposit: 30.00,
      status: 'COMPLETED',
      notes: 'Cliente satisfecho, devolución sin problemas',
      updatedAt: yesterday,
    },
    {
      id: randomUUID(),
      tenantId: demoTenant.id,
      itemId: items[2].id,
      customerId: customers[1].id,
      startDate: yesterday,
      endDate: nextWeek,
      totalPrice: 280.00,
      deposit: 56.00,
      status: 'IN_PROGRESS',
      notes: 'Cliente recogió el vehículo a tiempo',
      updatedAt: today,
    },
    {
      id: randomUUID(),
      tenantId: demoTenant.id,
      itemId: items[1].id,
      customerId: customers[2].id,
      startDate: tomorrow,
      endDate: nextWeek,
      totalPrice: 168.00,
      deposit: 33.60,
      status: 'CONFIRMED',
      notes: 'Cliente francés, comunicación en inglés',
      updatedAt: today,
    },
    {
      id: randomUUID(),
      tenantId: demoTenant.id,
      itemId: items[0].id,
      customerId: customers[3].id,
      startDate: nextWeek,
      endDate: nextMonth,
      totalPrice: 750.00,
      deposit: 150.00,
      status: 'PENDING',
      notes: 'Esperando confirmación de pago',
      updatedAt: today,
    },
    {
      id: randomUUID(),
      tenantId: demoTenant.id,
      itemId: items[1].id,
      customerId: customers[0].id,
      startDate: today,
      endDate: nextWeek,
      totalPrice: 196.00,
      deposit: 39.20,
      status: 'CANCELLED',
      notes: 'Cliente canceló por cambio de planes',
      updatedAt: today,
    },
    {
      id: randomUUID(),
      tenantId: demoTenant.id,
      itemId: items[1].id,
      customerId: customers[2].id,
      startDate: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000),
      endDate: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000),
      totalPrice: 140.00,
      deposit: 28.00,
      status: 'COMPLETED',
      notes: 'Excelente experiencia',
      updatedAt: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000),
    },
  ];

  await prisma.booking.createMany({ data: bookings });
  console.log('✅ Created sample bookings for demo tenant');

  // Create second tenant for testing isolation
  const testTenant = await prisma.tenant.upsert({
    where: { subdomain: 'test' },
    update: {},
    create: {
      id: randomUUID(),
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
      updatedAt: now,
    },
  });

  console.log('✅ Created test tenant:', testTenant.subdomain);

  // Create owner for test tenant
  const testOwner = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: 'owner@test.com',
      name: 'Test Owner',
      password: hashedPassword,
      role: 'OWNER',
      tenantId: testTenant.id,
      updatedAt: now,
    },
  });

  console.log('✅ Created test owner user:', testOwner.email);

  // Create "Scooters Madrid" tenant
  const scootersMadridTenant = await prisma.tenant.upsert({
    where: { subdomain: 'scooters-madrid' },
    update: {},
    create: {
      id: randomUUID(),
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
      updatedAt: now,
    },
  });

  console.log('✅ Created Scooters Madrid tenant:', scootersMadridTenant.subdomain);

  // Create owner for Scooters Madrid
  const scootersMadridOwner = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: 'admin@scooters-madrid.com',
      name: 'Carlos García',
      password: hashedPassword,
      role: 'OWNER',
      tenantId: scootersMadridTenant.id,
      updatedAt: now,
    },
  });

  console.log('✅ Created Scooters Madrid owner:', scootersMadridOwner.email);

  // Create sample items for Scooters Madrid
  const scooterItems = [
    {
      id: randomUUID(),
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
      updatedAt: now,
    },
    {
      id: randomUUID(),
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
      updatedAt: now,
    },
  ];

  await prisma.item.createMany({ data: scooterItems });
  console.log('✅ Created sample items for Scooters Madrid');

  // Create sample customers for Scooters Madrid
  const scooterCustomers = [
    {
      id: randomUUID(),
      tenantId: scootersMadridTenant.id,
      name: 'Ana Martínez',
      email: 'ana.martinez@example.com',
      phone: '+34 600 555 666',
      documentType: 'DNI',
      documentNumber: '87654321Y',
      address: 'Calle Serrano 45',
      city: 'Madrid',
      country: 'Spain',
      updatedAt: now,
    },
    {
      id: randomUUID(),
      tenantId: scootersMadridTenant.id,
      name: 'Luis Fernández',
      email: 'luis.fernandez@example.com',
      phone: '+34 600 777 888',
      documentType: 'NIE',
      documentNumber: 'X1234567Z',
      address: 'Plaza España 12',
      city: 'Madrid',
      country: 'Spain',
      updatedAt: now,
    },
  ];

  await prisma.customer.createMany({ data: scooterCustomers });
  console.log('✅ Created sample customers for Scooters Madrid');

  // Create bookings for Scooters Madrid
  const scooterBookings = [
    {
      id: randomUUID(),
      tenantId: scootersMadridTenant.id,
      itemId: scooterItems[0].id,
      customerId: scooterCustomers[0].id,
      startDate: tomorrow,
      endDate: new Date(tomorrow.getTime() + 3 * 24 * 60 * 60 * 1000),
      totalPrice: 75.00,
      deposit: 15.00,
      status: 'CONFIRMED',
      updatedAt: today,
    },
    {
      id: randomUUID(),
      tenantId: scootersMadridTenant.id,
      itemId: scooterItems[1].id,
      customerId: scooterCustomers[1].id,
      startDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
      endDate: yesterday,
      totalPrice: 90.00,
      deposit: 18.00,
      status: 'COMPLETED',
      updatedAt: yesterday,
    },
  ];

  await prisma.booking.createMany({ data: scooterBookings });
  console.log('✅ Created sample bookings for Scooters Madrid');

  // Create "Boats Marbella" tenant
  const boatsMarbellatenant = await prisma.tenant.upsert({
    where: { subdomain: 'boats-marbella' },
    update: {},
    create: {
      id: randomUUID(),
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
      updatedAt: now,
    },
  });

  console.log('✅ Created Boats Marbella tenant:', boatsMarbellatenant.subdomain);

  // Create owner for Boats Marbella
  const boatsMarbellaOwner = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: 'info@boats-marbella.com',
      name: 'Marina López',
      password: hashedPassword,
      role: 'OWNER',
      tenantId: boatsMarbellatenant.id,
      updatedAt: now,
    },
  });

  console.log('✅ Created Boats Marbella owner:', boatsMarbellaOwner.email);

  // Create sample items for Boats Marbella
  const boatItems = [
    {
      id: randomUUID(),
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
      updatedAt: now,
    },
    {
      id: randomUUID(),
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
      updatedAt: now,
    },
    {
      id: randomUUID(),
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
      updatedAt: now,
    },
  ];

  await prisma.item.createMany({ data: boatItems });
  console.log('✅ Created sample items for Boats Marbella');

  // Create sample customers for Boats Marbella
  const boatCustomers = [
    {
      id: randomUUID(),
      tenantId: boatsMarbellatenant.id,
      name: 'Robert Johnson',
      email: 'robert.johnson@example.com',
      phone: '+44 7900 123456',
      documentType: 'PASSPORT',
      documentNumber: 'UK789456',
      address: 'Kings Road 100',
      city: 'London',
      country: 'United Kingdom',
      updatedAt: now,
    },
    {
      id: randomUUID(),
      tenantId: boatsMarbellatenant.id,
      name: 'Hans Mueller',
      email: 'hans.mueller@example.com',
      phone: '+49 170 1234567',
      documentType: 'PASSPORT',
      documentNumber: 'DE123456',
      address: 'Hauptstrasse 50',
      city: 'Munich',
      country: 'Germany',
      updatedAt: now,
    },
    {
      id: randomUUID(),
      tenantId: boatsMarbellatenant.id,
      name: 'Sofia Rossi',
      email: 'sofia.rossi@example.com',
      phone: '+39 340 1234567',
      documentType: 'PASSPORT',
      documentNumber: 'IT654321',
      address: 'Via Roma 25',
      city: 'Milan',
      country: 'Italy',
      updatedAt: now,
    },
  ];

  await prisma.customer.createMany({ data: boatCustomers });
  console.log('✅ Created sample customers for Boats Marbella');

  // Create bookings for Boats Marbella
  const boatBookings = [
    {
      id: randomUUID(),
      tenantId: boatsMarbellatenant.id,
      itemId: boatItems[0].id,
      customerId: boatCustomers[0].id,
      startDate: new Date(tomorrow.getTime() + 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(tomorrow.getTime() + 8 * 24 * 60 * 60 * 1000),
      totalPrice: 2400.00,
      deposit: 480.00,
      status: 'CONFIRMED',
      notes: 'Cliente VIP, servicio de catering incluido',
      updatedAt: today,
    },
    {
      id: randomUUID(),
      tenantId: boatsMarbellatenant.id,
      itemId: boatItems[1].id,
      customerId: boatCustomers[1].id,
      startDate: tomorrow,
      endDate: new Date(tomorrow.getTime() + 2 * 24 * 60 * 60 * 1000),
      totalPrice: 900.00,
      deposit: 180.00,
      status: 'PENDING',
      updatedAt: today,
    },
    {
      id: randomUUID(),
      tenantId: boatsMarbellatenant.id,
      itemId: boatItems[2].id,
      customerId: boatCustomers[2].id,
      startDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      totalPrice: 1050.00,
      deposit: 210.00,
      status: 'COMPLETED',
      notes: 'Excelente experiencia, cliente muy satisfecho',
      updatedAt: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
    },
  ];

  await prisma.booking.createMany({ data: boatBookings });
  console.log('✅ Created sample bookings for Boats Marbella');

  // Generate invoices for all confirmed and completed bookings
  console.log('\n💵 Generating invoices for confirmed and completed bookings...');
  
  const allBookings = [...bookings, ...scooterBookings, ...boatBookings];
  const invoiceBookings = allBookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED');
  
  console.log(`📋 Found ${invoiceBookings.length} bookings to invoice`);

  let invoiceCounter = 1;
  const year = today.getFullYear();
  
  for (const booking of invoiceBookings) {
    const invoiceNumber = `INV-${year}-${String(invoiceCounter).padStart(4, '0')}`;
    const invoiceStatus = booking.status === 'COMPLETED' ? 'PAID' : 'PENDING';
    const paidAt = booking.status === 'COMPLETED' ? booking.updatedAt : null;

    await prisma.invoice.create({
      data: {
        id: randomUUID(),
        tenantId: booking.tenantId,
        bookingId: booking.id,
        invoiceNumber,
        amount: booking.totalPrice,
        status: invoiceStatus,
        dueDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
        paidAt: paidAt,
        updatedAt: today,
      },
    });

    console.log(`   ✓ Created invoice ${invoiceNumber}`);
    invoiceCounter++;
  }

  console.log('✅ Invoices generated successfully');

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
