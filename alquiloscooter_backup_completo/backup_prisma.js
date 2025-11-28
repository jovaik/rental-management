require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const prisma = new PrismaClient();

async function backupDatabase() {
  console.log('=== Iniciando Backup de Base de Datos ===');
  
  try {
    const backup = {
      timestamp: new Date().toISOString(),
      tables: {}
    };

    console.log('Backing up users...');
    backup.tables.users = await prisma.carRentalUsers.findMany();
    
    console.log('Backing up vehicles...');
    backup.tables.vehicles = await prisma.carRentalCars.findMany();
    
    console.log('Backing up bookings...');
    backup.tables.bookings = await prisma.carRentalBookings.findMany();
    
    console.log('Backing up customers...');
    backup.tables.customers = await prisma.carRentalCustomers.findMany();
    
    console.log('Backing up inspections...');
    backup.tables.inspections = await prisma.vehicleInspections.findMany();
    
    console.log('Backing up payments...');
    backup.tables.payments = await prisma.bookingPayments.findMany();
    
    console.log('Backing up deposits...');
    backup.tables.deposits = await prisma.bookingDeposits.findMany();
    
    console.log('Backing up config...');
    backup.tables.config = await prisma.companyConfig.findMany();
    
    const backupPath = '/home/ubuntu/BACKUP_SEGURIDAD_20251116_192418/database_backup.json';
    await fs.writeFile(backupPath, JSON.stringify(backup, null, 2));
    
    console.log(`\n✓ Backup completado: ${backupPath}`);
    
    console.log('\n=== Estadísticas del Backup ===');
    console.log(`Usuarios: ${backup.tables.users.length}`);
    console.log(`Vehículos: ${backup.tables.vehicles.length}`);
    console.log(`Reservas: ${backup.tables.bookings.length}`);
    console.log(`Clientes: ${backup.tables.customers.length}`);
    console.log(`Inspecciones: ${backup.tables.inspections.length}`);
    console.log(`Pagos: ${backup.tables.payments.length}`);
    console.log(`Depósitos: ${backup.tables.deposits.length}`);
    
    const stats = await fs.stat(backupPath);
    console.log(`Tamaño: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error('Error creando backup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

backupDatabase();
