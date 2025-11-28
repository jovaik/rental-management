const { PrismaClient } = require('@prisma/client');

// Source database (Abacus.AI)
const prismaSource = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://role_43c1c84ad:sEELkXUYGfVvh4naABX9p2XZgDP3UKMC@db-43c1c84ad.db003.hosteddb.reai.io:5432/43c1c84ad?connect_timeout=15'
    }
  }
});

// Target database (Neon)
const prismaTarget = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_giGslv78NtrJ@ep-red-waterfall-aex88kcu-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require'
    }
  }
});

async function migrateTenants() {
  console.log('Migrando Tenants...');
  const tenants = await prismaSource.tenant.findMany();
  console.log(`Encontrados ${tenants.length} tenants`);
  
  for (const tenant of tenants) {
    await prismaTarget.tenant.upsert({
      where: { id: tenant.id },
      update: tenant,
      create: tenant
    });
  }
  console.log(`✓ ${tenants.length} tenants migrados`);
  return tenants.length;
}

async function migrateUsers() {
  console.log('Migrando Users...');
  const users = await prismaSource.user.findMany();
  console.log(`Encontrados ${users.length} users`);
  
  for (const user of users) {
    await prismaTarget.user.upsert({
      where: { id: user.id },
      update: user,
      create: user
    });
  }
  console.log(`✓ ${users.length} users migrados`);
  return users.length;
}

async function migrateItems() {
  console.log('Migrando Items...');
  const items = await prismaSource.item.findMany();
  console.log(`Encontrados ${items.length} items`);
  
  for (const item of items) {
    await prismaTarget.item.upsert({
      where: { id: item.id },
      update: item,
      create: item
    });
  }
  console.log(`✓ ${items.length} items migrados`);
  return items.length;
}

async function migrateCustomers() {
  console.log('Migrando Customers...');
  const customers = await prismaSource.customer.findMany();
  console.log(`Encontrados ${customers.length} customers`);
  
  for (const customer of customers) {
    await prismaTarget.customer.upsert({
      where: { id: customer.id },
      update: customer,
      create: customer
    });
  }
  console.log(`✓ ${customers.length} customers migrados`);
  return customers.length;
}

async function migrateBookings() {
  console.log('Migrando Bookings...');
  const bookings = await prismaSource.booking.findMany();
  console.log(`Encontrados ${bookings.length} bookings`);
  
  for (const booking of bookings) {
    await prismaTarget.booking.upsert({
      where: { id: booking.id },
      update: booking,
      create: booking
    });
  }
  console.log(`✓ ${bookings.length} bookings migrados`);
  return bookings.length;
}

async function migrateInvoices() {
  console.log('Migrando Invoices...');
  const invoices = await prismaSource.invoice.findMany();
  console.log(`Encontrados ${invoices.length} invoices`);
  
  for (const invoice of invoices) {
    await prismaTarget.invoice.upsert({
      where: { id: invoice.id },
      update: invoice,
      create: invoice
    });
  }
  console.log(`✓ ${invoices.length} invoices migrados`);
  return invoices.length;
}

async function main() {
  try {
    console.log('=== INICIANDO MIGRACIÓN DE DATOS ===\n');
    
    const stats = {
      tenants: await migrateTenants(),
      users: await migrateUsers(),
      items: await migrateItems(),
      customers: await migrateCustomers(),
      bookings: await migrateBookings(),
      invoices: await migrateInvoices()
    };
    
    console.log('\n=== MIGRACIÓN COMPLETADA ===');
    console.log('Resumen:');
    console.log(`  - Tenants: ${stats.tenants}`);
    console.log(`  - Users: ${stats.users}`);
    console.log(`  - Items: ${stats.items}`);
    console.log(`  - Customers: ${stats.customers}`);
    console.log(`  - Bookings: ${stats.bookings}`);
    console.log(`  - Invoices: ${stats.invoices}`);
    console.log(`  - TOTAL: ${Object.values(stats).reduce((a, b) => a + b, 0)} registros\n`);
    
  } catch (error) {
    console.error('Error durante la migración:', error);
    process.exit(1);
  } finally {
    await prismaSource.$disconnect();
    await prismaTarget.$disconnect();
  }
}

main();
