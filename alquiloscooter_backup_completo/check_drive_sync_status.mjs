import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSyncStatus() {
  try {
    console.log('📊 Verificando estado de sincronización con Google Drive...\n');
    
    // Contar reservas totales
    const totalBookings = await prisma.carRentalBookings.count();
    console.log(`Total de reservas: ${totalBookings}`);
    
    // Contar reservas CON carpeta de Drive
    const syncedBookings = await prisma.carRentalBookings.count({
      where: {
        google_drive_folder_id: { not: null }
      }
    });
    console.log(`Reservas sincronizadas con Drive: ${syncedBookings}`);
    
    // Contar reservas SIN carpeta de Drive
    const unsyncedBookings = await prisma.carRentalBookings.count({
      where: {
        google_drive_folder_id: null
      }
    });
    console.log(`Reservas NO sincronizadas: ${unsyncedBookings}\n`);
    
    // Mostrar últimas 5 reservas no sincronizadas
    const recentUnsynced = await prisma.carRentalBookings.findMany({
      where: {
        google_drive_folder_id: null
      },
      orderBy: { created_at: 'desc' },
      take: 5,
      select: {
        id: true,
        booking_number: true,
        customer_name: true,
        created_at: true,
        status: true
      }
    });
    
    if (recentUnsynced.length > 0) {
      console.log('⚠️ Últimas reservas sin sincronizar con Drive:');
      recentUnsynced.forEach(b => {
        console.log(`  - #${b.booking_number} | ${b.customer_name} | ${b.status} | ${new Date(b.created_at).toLocaleString('es-ES')}`);
      });
    }
    
    // Mostrar últimas 3 reservas sincronizadas
    console.log('\n✅ Últimas reservas sincronizadas con Drive:');
    const recentSynced = await prisma.carRentalBookings.findMany({
      where: {
        google_drive_folder_id: { not: null }
      },
      orderBy: { created_at: 'desc' },
      take: 3,
      select: {
        id: true,
        booking_number: true,
        customer_name: true,
        google_drive_folder_url: true,
        created_at: true
      }
    });
    
    recentSynced.forEach(b => {
      console.log(`  - #${b.booking_number} | ${b.customer_name} | ${new Date(b.created_at).toLocaleString('es-ES')}`);
      console.log(`    URL: ${b.google_drive_folder_url || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSyncStatus();
