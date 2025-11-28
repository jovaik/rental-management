import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyStatus() {
  try {
    const total = await prisma.carRentalBookings.count();
    const synced = await prisma.carRentalBookings.count({
      where: { google_drive_folder_id: { not: null } }
    });
    const unsynced = await prisma.carRentalBookings.count({
      where: { google_drive_folder_id: null }
    });
    
    console.log('📊 Estado final de sincronización con Google Drive:');
    console.log(`   Total de reservas: ${total}`);
    console.log(`   Sincronizadas: ${synced} (${((synced/total)*100).toFixed(1)}%)`);
    console.log(`   Sin sincronizar: ${unsynced}`);
    
    if (unsynced === 0) {
      console.log('\n✅ ¡PERFECTO! Todas las reservas están sincronizadas con Drive');
    }
    
    // Mostrar últimas 5 sincronizadas
    const recent = await prisma.carRentalBookings.findMany({
      where: { google_drive_folder_id: { not: null } },
      orderBy: { id: 'desc' },
      take: 5,
      select: {
        booking_number: true,
        customer_name: true,
        google_drive_folder_url: true
      }
    });
    
    console.log('\n📁 Últimas 5 carpetas sincronizadas:');
    recent.forEach(b => {
      console.log(`   ${b.booking_number} - ${b.customer_name}`);
      console.log(`   ${b.google_drive_folder_url}\n`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyStatus();
