// Cargar las variables de entorno del backup manualmente
process.env.DATABASE_URL = "postgresql://role_5f4c8d7db:HjDZDNxgN01PorW4ozp2phgmd7OWrEb0@db-5f4c8d7db.db002.hosteddb.reai.io:5432/5f4c8d7db?connect_timeout=15";

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('🔍 Verificando conexión a la base de datos...\n');
    
    // Verificar conexión
    await prisma.$connect();
    console.log('✅ Conectado exitosamente\n');
    
    // Buscar tablas con tenant
    console.log('📋 Buscando tablas relacionadas con "Tenant"...');
    const tenantCheck = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND LOWER(table_name) LIKE '%tenant%'
    `;
    if (tenantCheck.length > 0) {
      console.log('  Tablas encontradas:');
      tenantCheck.forEach(t => console.log(`    - ${t.table_name}`));
    } else {
      console.log('  ⚠️  No se encontraron tablas con "tenant" en el nombre');
    }
    console.log('');
    
    // Verificar usuarios con SQL directo
    console.log('👥 Usuarios en CarRentalUsers:');
    try {
      const users = await prisma.$queryRaw`
        SELECT id, email, username, firstname, lastname, role, status 
        FROM "CarRentalUsers" 
        LIMIT 10
      `;
      
      if (users.length > 0) {
        console.log(`  Total: ${users.length} usuarios encontrados\n`);
        users.forEach(user => {
          console.log(`  📧 Email: ${user.email}`);
          console.log(`     Username: ${user.username || 'N/A'}`);
          console.log(`     Nombre: ${user.firstname} ${user.lastname}`);
          console.log(`     Rol: ${user.role}`);
          console.log(`     Estado: ${user.status}`);
          console.log('');
        });
      } else {
        console.log('  ⚠️  No se encontraron usuarios en la base de datos\n');
      }
    } catch (err) {
      console.log(`  ⚠️  Error al consultar usuarios: ${err.message}\n`);
    }
    
    // Verificar ubicaciones
    console.log('📍 Ubicaciones:');
    try {
      const locations = await prisma.$queryRaw`
        SELECT id, name, status FROM "CarRentalLocations" LIMIT 5
      `;
      console.log(`  Total: ${locations.length} ubicaciones\n`);
    } catch (err) {
      console.log(`  ⚠️  Error: ${err.message}\n`);
    }
    
    // Verificar vehículos
    console.log('🚗 Vehículos:');
    try {
      const vehicles = await prisma.$queryRaw`
        SELECT id, registration_number, make, model, status FROM "CarRentalCars" LIMIT 5
      `;
      console.log(`  Total: ${vehicles.length} vehículos\n`);
    } catch (err) {
      console.log(`  ⚠️  Error: ${err.message}\n`);
    }
    
    // Verificar reservas
    console.log('📅 Reservas:');
    try {
      const bookings = await prisma.$queryRaw`
        SELECT id, customer_name, status FROM "CarRentalBookings" LIMIT 5
      `;
      console.log(`  Total: ${bookings.length} reservas\n`);
    } catch (err) {
      console.log(`  ⚠️  Error: ${err.message}\n`);
    }
    
    console.log('✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
