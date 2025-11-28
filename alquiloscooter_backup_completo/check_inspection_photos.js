require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPhotos() {
  try {
    console.log('🔍 Verificando fotos de inspección para reserva 202510260001\n');
    
    const booking = await prisma.carRentalBookings.findFirst({
      where: { booking_number: '202510260001' },
      include: {
        inspections: {
          select: {
            id: true,
            inspection_type: true,
            front_photo: true,
            left_photo: true,
            rear_photo: true,
            right_photo: true,
            odometer_photo: true,
            created_at: true
          }
        },
        vehicles: {
          include: {
            car: {
              select: {
                registration_number: true,
                make: true,
                model: true
              }
            }
          }
        }
      }
    });
    
    if (!booking) {
      console.log('❌ Reserva no encontrada');
      return;
    }
    
    console.log(`📋 Reserva: ${booking.booking_number}`);
    console.log(`🚗 Vehículos: ${booking.vehicles.length}`);
    booking.vehicles.forEach((bv, i) => {
      console.log(`   ${i+1}. ${bv.car.registration_number} (${bv.car.make} ${bv.car.model})`);
    });
    
    console.log(`\n📸 Inspecciones encontradas: ${booking.inspections.length}\n`);
    
    let totalPhotos = 0;
    
    booking.inspections.forEach((insp, idx) => {
      console.log(`\n--- Inspección #${idx + 1} (ID: ${insp.id}) ---`);
      console.log(`   Tipo: ${insp.inspection_type}`);
      console.log(`   Fecha: ${insp.created_at}`);
      
      const photos = [
        insp.front_photo,
        insp.left_photo,
        insp.rear_photo,
        insp.right_photo,
        insp.odometer_photo
      ].filter(p => p !== null);
      
      console.log(`   Fotos: ${photos.length}/5`);
      totalPhotos += photos.length;
      
      photos.forEach((photo, i) => {
        console.log(`      ${i+1}. ${photo?.substring(0, 60)}...`);
      });
    });
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 TOTAL DE FOTOS EN DB: ${totalPhotos}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
    if (totalPhotos > 10) {
      console.log(`⚠️  PROBLEMA: Hay ${totalPhotos} fotos en lugar de máximo 10`);
      console.log(`    Esto indica duplicación de inspecciones\n`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPhotos();
