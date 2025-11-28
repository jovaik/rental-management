const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_giGslv78NtrJ@ep-red-waterfall-aex88kcu-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require'
    }
  }
});

async function testConnection() {
  try {
    console.log('=== PRUEBA DE CONEXIÓN A NEON ===\n');
    
    // Test connection
    await prisma.$connect();
    console.log('✓ Conexión exitosa a Neon\n');
    
    // Test queries
    const tenants = await prisma.tenant.count();
    const users = await prisma.user.count();
    const items = await prisma.item.count();
    const customers = await prisma.customer.count();
    const bookings = await prisma.booking.count();
    const invoices = await prisma.invoice.count();
    
    console.log('Conteo de registros:');
    console.log(`  - Tenants: ${tenants}`);
    console.log(`  - Users: ${users}`);
    console.log(`  - Items: ${items}`);
    console.log(`  - Customers: ${customers}`);
    console.log(`  - Bookings: ${bookings}`);
    console.log(`  - Invoices: ${invoices}`);
    
    // Test finding a specific user
    const demoUser = await prisma.user.findFirst({
      where: { email: 'owner@demo.com' }
    });
    
    if (demoUser) {
      console.log('\n✓ Usuario demo encontrado:');
      console.log(`  - Email: ${demoUser.email}`);
      console.log(`  - Role: ${demoUser.role}`);
      console.log(`  - ID: ${demoUser.id}`);
    }
    
    console.log('\n=== TODAS LAS PRUEBAS PASARON ===');
    
  } catch (error) {
    console.error('Error en la prueba:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
