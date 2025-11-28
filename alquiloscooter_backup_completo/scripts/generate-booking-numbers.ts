
/**
 * Script para generar booking_numbers para reservas existentes
 * Ejecutar con: yarn tsx scripts/generate-booking-numbers.ts
 */

import { config } from 'dotenv';
config(); // Cargar variables de entorno

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Genera un booking number basado en la fecha de recogida
 */
function generateBookingNumberForDate(date: Date, sequentialNumber: number): string {
  const year = date.getFullYear().toString().slice(-3);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  const datePrefix = `${year}${month}${day}`;
  const sequentialStr = sequentialNumber.toString().padStart(4, '0');
  
  return `${datePrefix}${sequentialStr}`;
}

async function generateBookingNumbers() {
  try {
    console.log('🔍 Buscando reservas sin número de expediente...');
    
    // Obtener todas las reservas sin booking_number, ordenadas por fecha de recogida
    const bookingsWithoutNumber = await prisma.carRentalBookings.findMany({
      where: {
        booking_number: null
      },
      orderBy: {
        pickup_date: 'asc'
      }
    });
    
    console.log(`📊 Encontradas ${bookingsWithoutNumber.length} reservas sin número de expediente`);
    
    if (bookingsWithoutNumber.length === 0) {
      console.log('✅ Todas las reservas ya tienen número de expediente');
      return;
    }
    
    // Agrupar reservas por fecha (día) para generar secuenciales
    const bookingsByDate = new Map<string, typeof bookingsWithoutNumber>();
    
    for (const booking of bookingsWithoutNumber) {
      if (!booking.pickup_date) continue;
      
      const dateKey = booking.pickup_date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!bookingsByDate.has(dateKey)) {
        bookingsByDate.set(dateKey, []);
      }
      
      bookingsByDate.get(dateKey)!.push(booking);
    }
    
    console.log(`📅 Procesando ${bookingsByDate.size} días diferentes...`);
    
    let totalUpdated = 0;
    
    // Procesar cada día
    for (const [dateKey, bookings] of bookingsByDate.entries()) {
      const date = new Date(dateKey);
      const year = date.getFullYear().toString().slice(-3);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const datePrefix = `${year}${month}${day}`;
      
      // Buscar el último número secuencial existente para ese día
      const lastBookingForDay = await prisma.carRentalBookings.findFirst({
        where: {
          booking_number: {
            startsWith: datePrefix
          }
        },
        orderBy: {
          booking_number: 'desc'
        }
      });
      
      let startSequential = 1;
      if (lastBookingForDay && lastBookingForDay.booking_number) {
        startSequential = parseInt(lastBookingForDay.booking_number.slice(-4)) + 1;
      }
      
      console.log(`  📆 ${dateKey}: Generando ${bookings.length} expedientes (desde ${datePrefix}${startSequential.toString().padStart(4, '0')})`);
      
      // Actualizar cada reserva del día
      for (let i = 0; i < bookings.length; i++) {
        const booking = bookings[i];
        const sequential = startSequential + i;
        const bookingNumber = generateBookingNumberForDate(date, sequential);
        
        await prisma.carRentalBookings.update({
          where: { id: booking.id },
          data: { booking_number: bookingNumber }
        });
        
        totalUpdated++;
        
        if (totalUpdated % 10 === 0) {
          console.log(`    ✓ Actualizadas ${totalUpdated}/${bookingsWithoutNumber.length} reservas`);
        }
      }
    }
    
    console.log(`\n✅ Proceso completado: ${totalUpdated} números de expediente generados`);
    
    // Verificar que todas las reservas ahora tienen booking_number
    const remainingWithoutNumber = await prisma.carRentalBookings.count({
      where: {
        booking_number: null
      }
    });
    
    if (remainingWithoutNumber > 0) {
      console.log(`⚠️  Aún quedan ${remainingWithoutNumber} reservas sin número de expediente`);
    } else {
      console.log('🎉 Todas las reservas ahora tienen número de expediente');
    }
    
  } catch (error) {
    console.error('❌ Error generando números de expediente:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
generateBookingNumbers()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
