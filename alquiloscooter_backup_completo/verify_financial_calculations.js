const { PrismaClient } = require('@prisma/client');
require('dotenv/config');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('\n💰 VERIFICACIÓN DE CÁLCULOS FINANCIEROS\n');
    console.log('='.repeat(70));

    // 1. Obtener todas las reservas confirmadas y completadas de noviembre 2025
    const noviembreReservas = await prisma.carRentalBookings.findMany({
      where: {
        pickup_date: {
          gte: new Date('2025-11-01'),
          lt: new Date('2025-12-01')
        },
        status: { in: ['confirmed', 'completed'] }
      },
      select: {
        id: true,
        booking_number: true,
        pickup_date: true,
        return_date: true,
        total_price: true,
        status: true,
        customer_name: true
      },
      orderBy: { pickup_date: 'asc' }
    });

    console.log(`\n📅 RESERVAS DE NOVIEMBRE 2025 (Confirmadas + Completadas):`);
    console.log(`Total: ${noviembreReservas.length} reservas\n`);

    let totalNoviembreBookings = 0;
    noviembreReservas.forEach(r => {
      const precio = Number(r.total_price);
      totalNoviembreBookings += precio;
      console.log(`  ${r.booking_number} | ${r.customer_name?.substring(0, 20).padEnd(20)} | €${precio.toFixed(2)} | ${r.status}`);
    });

    console.log(`\n📊 TOTAL NOVIEMBRE (desde Bookings): €${totalNoviembreBookings.toFixed(2)}`);

    // 2. Verificar si existen pagos registrados
    const pagos = await prisma.bookingPayments.findMany({
      where: {
        booking: {
          pickup_date: {
            gte: new Date('2025-11-01'),
            lt: new Date('2025-12-01')
          },
          status: { in: ['confirmed', 'completed'] }
        }
      },
      include: {
        booking: {
          select: {
            booking_number: true,
            customer_name: true
          }
        }
      }
    });

    console.log(`\n💳 PAGOS REGISTRADOS (noviembre):`);
    console.log(`Total pagos: ${pagos.length}`);

    if (pagos.length > 0) {
      let totalPagos = 0;
      pagos.forEach(p => {
        const monto = Number(p.monto);
        totalPagos += monto;
        console.log(`  ${p.booking.booking_number} | ${p.booking.customer_name?.substring(0, 20).padEnd(20)} | €${monto.toFixed(2)}`);
      });
      console.log(`\n📊 TOTAL PAGOS: €${totalPagos.toFixed(2)}`);
    } else {
      console.log(`  ⚠️  NO HAY PAGOS REGISTRADOS`);
      console.log(`  📌 El dashboard está intentando sumar pagos (BookingPayments)`);
      console.log(`  📌 pero las reservas no tienen pagos registrados`);
      console.log(`  📌 Debe usar total_price de carRentalBookings`);
    }

    // 3. Ver qué muestra la página de reservas (62 reservas totales)
    const todasReservas = await prisma.carRentalBookings.findMany({
      where: {
        status: { in: ['confirmed', 'completed'] }
      },
      select: {
        total_price: true,
        pickup_date: true
      }
    });

    const totalTodasReservas = todasReservas.reduce((sum, r) => sum + Number(r.total_price), 0);
    console.log(`\n📊 TODAS LAS RESERVAS (Confirmadas + Completadas):`);
    console.log(`Total: ${todasReservas.length} reservas`);
    console.log(`Total ingresos: €${totalTodasReservas.toFixed(2)}`);

    // 4. Ver la distribución por mes
    const mesesMap = new Map();
    todasReservas.forEach(r => {
      const fecha = new Date(r.pickup_date);
      const mesAno = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      const precio = Number(r.total_price);
      mesesMap.set(mesAno, (mesesMap.get(mesAno) || 0) + precio);
    });

    console.log(`\n📅 INGRESOS POR MES:`);
    [...mesesMap.entries()].sort().forEach(([mes, total]) => {
      console.log(`  ${mes}: €${total.toFixed(2)}`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ VERIFICACIÓN COMPLETADA\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
