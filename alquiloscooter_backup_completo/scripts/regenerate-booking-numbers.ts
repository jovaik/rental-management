
/**
 * Script para regenerar los números de expediente
 * Formato correcto: YYYYMMDD0001
 */

import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DayCounter {
  [key: string]: number;
}

async function regenerateBookingNumbers() {
  console.log('🔄 Iniciando regeneración de números de expediente...\n');
  
  try {
    // Obtener todas las reservas ordenadas por fecha de recogida y ID
    const bookings = await prisma.carRentalBookings.findMany({
      where: {
        pickup_date: { not: null }
      },
      orderBy: [
        { pickup_date: 'asc' },
        { id: 'asc' }
      ]
    });

    console.log(`📊 Total de reservas a procesar: ${bookings.length}\n`);

    // Agrupar por día para asignar números secuenciales
    const dayCounter: DayCounter = {};
    const updates = [];

    for (const booking of bookings) {
      // Usar la fecha de recogida para generar el número de expediente
      const createdDate = new Date(booking.pickup_date!);
      
      const year = createdDate.getFullYear().toString(); // Año completo (4 dígitos)
      const month = (createdDate.getMonth() + 1).toString().padStart(2, '0');
      const day = createdDate.getDate().toString().padStart(2, '0');
      
      const dateKey = `${year}${month}${day}`;
      
      // Incrementar contador del día
      if (!dayCounter[dateKey]) {
        dayCounter[dateKey] = 1;
      } else {
        dayCounter[dateKey]++;
      }
      
      // Generar el nuevo número de expediente
      const sequential = dayCounter[dateKey].toString().padStart(4, '0');
      const newBookingNumber = `${dateKey}${sequential}`;
      
      // Preparar actualización
      updates.push({
        id: booking.id,
        oldNumber: booking.booking_number,
        newNumber: newBookingNumber,
        date: createdDate.toISOString().split('T')[0]
      });
    }

    console.log('📝 Actualizando números de expediente...\n');

    // Actualizar en la base de datos
    for (const update of updates) {
      await prisma.carRentalBookings.update({
        where: { id: update.id },
        data: { booking_number: update.newNumber }
      });
      
      console.log(`✅ Reserva ID ${update.id}:`);
      console.log(`   Fecha: ${update.date}`);
      console.log(`   Anterior: ${update.oldNumber || 'sin número'}`);
      console.log(`   Nuevo: ${update.newNumber}`);
      console.log('');
    }

    console.log('\n✅ Regeneración completada exitosamente!\n');
    
    // Mostrar estadísticas
    console.log('📊 Estadísticas por día:');
    const sortedDays = Object.keys(dayCounter).sort();
    for (const day of sortedDays) {
      const year = day.slice(0, 4);
      const month = day.slice(4, 6);
      const dayNum = day.slice(6, 8);
      console.log(`   ${year}-${month}-${dayNum}: ${dayCounter[day]} reserva(s)`);
    }
    
  } catch (error) {
    console.error('❌ Error regenerando números de expediente:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
regenerateBookingNumbers()
  .then(() => {
    console.log('\n🎉 Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
