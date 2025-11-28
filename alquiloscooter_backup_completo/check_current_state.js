const { PrismaClient } = require('@prisma/client');
require('dotenv/config');

const prisma = new PrismaClient();

async function main() {
  try {
    // Obtener todas las reservas ordenadas por ID
    const reservas = await prisma.carRentalBookings.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        booking_number: true,
        status: true,
        total_price: true,
        created_at: true,
        pickup_date: true,
        return_date: true
      }
    });

    console.log('📊 ESTADO ACTUAL DE RESERVAS:\n');
    console.log(`Total reservas: ${reservas.length}`);
    
    // Calcular total
    const total = reservas.reduce((sum, r) => sum + (parseFloat(r.total_price) || 0), 0);
    console.log(`Total económico: €${total.toFixed(2)}\n`);

    // Mostrar rango de IDs
    if (reservas.length > 0) {
      const minId = reservas[0].id;
      const maxId = reservas[reservas.length - 1].id;
      console.log(`Rango de IDs: ${minId} - ${maxId}\n`);
    }

    // Analizar por fecha de creación
    const nov22 = new Date('2024-11-22T23:59:59Z');
    const nov23 = new Date('2024-11-23T00:00:00Z');
    const nov24 = new Date('2024-11-24T00:00:00Z');

    const antes22 = reservas.filter(r => new Date(r.created_at) < nov22);
    const dia23 = reservas.filter(r => new Date(r.created_at) >= nov23 && new Date(r.created_at) < nov24);
    const dia24 = reservas.filter(r => new Date(r.created_at) >= nov24);

    console.log(`📅 ANÁLISIS POR FECHA DE CREACIÓN:`);
    console.log(`Antes del 22 nov: ${antes22.length} reservas (IDs: ${antes22.map(r => r.id).join(', ')})`);
    console.log(`Día 23 nov: ${dia23.length} reservas (IDs: ${dia23.map(r => r.id).join(', ')})`);
    console.log(`Día 24 nov (HOY): ${dia24.length} reservas (IDs: ${dia24.map(r => r.id).join(', ')})\n`);

    // IDs a eliminar (las del 24 de noviembre - mis importaciones)
    console.log(`🗑️  IDs A ELIMINAR (Importaciones del 24 nov):`);
    console.log(dia24.map(r => r.id).join(', '));
    console.log(`\nTotal a eliminar: ${dia24.length} reservas`);
    
    const totalEliminar = dia24.reduce((sum, r) => sum + (parseFloat(r.total_price) || 0), 0);
    console.log(`Importe total a eliminar: €${totalEliminar.toFixed(2)}`);

    // Lo que quedará después
    const quedaranReservas = antes22.concat(dia23);
    const totalQuedarà = quedaranReservas.reduce((sum, r) => sum + (parseFloat(r.total_price) || 0), 0);
    console.log(`\n✅ DESPUÉS DE ELIMINAR:`);
    console.log(`Quedarán: ${quedaranReservas.length} reservas`);
    console.log(`Total económico: €${totalQuedarà.toFixed(2)}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
