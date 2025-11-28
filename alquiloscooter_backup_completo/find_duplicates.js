const { PrismaClient } = require('@prisma/client');
require('dotenv/config');

const prisma = new PrismaClient();

async function main() {
  try {
    const reservas = await prisma.carRentalBookings.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        booking_number: true,
        total_price: true,
        pickup_date: true,
        return_date: true
      }
    });

    // Identificar las importadas (booking_number hexadecimal o NULL)
    const importadas = reservas.filter(r => {
      if (!r.booking_number) return true;
      // Si el booking_number NO empieza con "2025" es importado
      return !r.booking_number.startsWith('2025');
    });

    // Las originales
    const originales = reservas.filter(r => {
      return r.booking_number && r.booking_number.startsWith('2025');
    });

    console.log('📊 ANÁLISIS DE RESERVAS:\n');
    console.log(`Total reservas: ${reservas.length}`);
    console.log(`Reservas ORIGINALES: ${originales.length} (IDs: ${originales.length > 0 ? originales[0].id + '-' + originales[originales.length-1].id : 'ninguna'})`);
    console.log(`Reservas IMPORTADAS: ${importadas.length} (IDs: ${importadas.length > 0 ? importadas[0].id + '-' + importadas[importadas.length-1].id : 'ninguna'})\n`);

    const totalOriginales = originales.reduce((sum, r) => sum + (parseFloat(r.total_price) || 0), 0);
    const totalImportadas = importadas.reduce((sum, r) => sum + (parseFloat(r.total_price) || 0), 0);

    console.log(`💰 ECONÓMICO:`);
    console.log(`Total ORIGINALES: €${totalOriginales.toFixed(2)}`);
    console.log(`Total IMPORTADAS: €${totalImportadas.toFixed(2)}`);
    console.log(`Total ACTUAL: €${(totalOriginales + totalImportadas).toFixed(2)}\n`);

    console.log(`🗑️  IDS A ELIMINAR (Importadas de Rodeeo):`);
    if (importadas.length > 0) {
      const idsToDelete = importadas.map(r => r.id).sort((a, b) => a - b);
      console.log(idsToDelete.join(', '));
      console.log(`\nTotal a eliminar: ${importadas.length} reservas`);
      console.log(`Importe a eliminar: €${totalImportadas.toFixed(2)}\n`);
    }

    console.log(`✅ DESPUÉS DE ELIMINAR QUEDARÁN:`);
    console.log(`${originales.length} reservas`);
    console.log(`Total: €${totalOriginales.toFixed(2)}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
