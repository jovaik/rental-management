require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificar() {
  try {
    console.log('📊 ANÁLISIS COMPLETO DE RESERVAS Y SINCRONIZACIÓN GSControl\n');
    console.log('='.repeat(70));
    
    // 1. Contar reservas por estado
    const estados = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    
    console.log('\n1️⃣ RESERVAS POR ESTADO:');
    console.log('-'.repeat(70));
    
    let totalGeneral = 0;
    for (const estado of estados) {
      const bookings = await prisma.carRentalBookings.findMany({
        where: { status: estado },
        select: {
          booking_number: true,
          total_price: true
        }
      });
      
      const total = bookings.reduce((sum, b) => sum + parseFloat(b.total_price), 0);
      totalGeneral += total;
      
      console.log(`\n  ${estado}:`);
      console.log(`    - Cantidad: ${bookings.length} reservas`);
      console.log(`    - Total: €${total.toFixed(2)}`);
    }
    
    console.log(`\n  TOTAL GENERAL: €${totalGeneral.toFixed(2)}`);
    
    // 2. Verificar reservas COBRADAS (CONFIRMED + COMPLETED)
    console.log('\n\n2️⃣ RESERVAS COBRADAS (que deberían estar en GSControl):');
    console.log('-'.repeat(70));
    
    const reservasCobradas = await prisma.carRentalBookings.findMany({
      where: {
        status: {
          in: ['CONFIRMED', 'COMPLETED']
        }
      },
      select: {
        id: true,
        booking_number: true,
        total_price: true,
        status: true
      },
      orderBy: {
        booking_number: 'asc'
      }
    });

    let totalCobrado = 0;
    
    console.log(`\n  Total: ${reservasCobradas.length} reservas\n`);
    
    // Verificar si tienen pagos asociados
    for (const r of reservasCobradas) {
      const pago = await prisma.bookingPayments.findFirst({
        where: {
          booking_id: r.id
        },
        select: {
          gscontrol_id: true,
          monto: true
        }
      });
      
      totalCobrado += parseFloat(r.total_price);
      console.log(`  ${r.booking_number}: €${r.total_price} [${r.status}] ${pago?.gscontrol_id ? '✅ Sincronizada' : '❌ NO sincronizada'}`);
    }

    console.log(`\n  TOTAL COBRADO: €${totalCobrado.toFixed(2)}`);

    // 3. Verificar pagos adicionales sincronizados (daños, etc.)
    console.log('\n\n3️⃣ PAGOS SINCRONIZADOS CON GSCONTROL:');
    console.log('-'.repeat(70));
    
    const pagosSincronizados = await prisma.bookingPayments.findMany({
      where: {
        gscontrol_id: {
          not: null
        }
      },
      include: {
        booking: {
          select: {
            booking_number: true
          }
        }
      }
    });

    let totalPagosSincronizados = 0;
    console.log(`\n  Total: ${pagosSincronizados.length} pagos\n`);
    
    pagosSincronizados.forEach(p => {
      totalPagosSincronizados += parseFloat(p.monto);
      console.log(`  ${p.booking?.booking_number || 'N/A'}: €${p.monto} [${p.concepto}] - GSControl ID: ${p.gscontrol_id}`);
    });

    console.log(`\n  TOTAL PAGOS SINCRONIZADOS: €${totalPagosSincronizados.toFixed(2)}`);

    // 4. Verificar gastos de mantenimiento sincronizados
    console.log('\n\n4️⃣ GASTOS DE MANTENIMIENTO SINCRONIZADOS:');
    console.log('-'.repeat(70));
    
    const gastosSincronizados = await prisma.carRentalMaintenanceExpenses.findMany({
      where: {
        gscontrol_id: {
          not: null
        }
      }
    });

    let totalGastosSincronizados = 0;
    console.log(`\n  Total: ${gastosSincronizados.length} gastos\n`);
    
    gastosSincronizados.forEach(g => {
      totalGastosSincronizados += parseFloat(g.total_price);
      console.log(`  ${g.description || g.item_name}: €${g.total_price} - GSControl ID: ${g.gscontrol_id}`);
    });

    console.log(`\n  TOTAL GASTOS SINCRONIZADOS: €${totalGastosSincronizados.toFixed(2)}`);

    // 5. RESUMEN FINAL
    console.log('\n\n5️⃣ RESUMEN FINAL:');
    console.log('='.repeat(70));
    console.log(`\n  📊 EN NUESTRA BASE DE DATOS:`);
    console.log(`    - Reservas COBRADAS (CONFIRMED + COMPLETED): ${reservasCobradas.length} por €${totalCobrado.toFixed(2)}`);
    console.log(`    - Pagos sincronizados a GSControl: ${pagosSincronizados.length} por €${totalPagosSincronizados.toFixed(2)}`);
    console.log(`    - Gastos sincronizados a GSControl: ${gastosSincronizados.length} por €${totalGastosSincronizados.toFixed(2)}`);
    
    console.log(`\n  💰 BALANCE SINCRONIZADO:`);
    console.log(`    - Ingresos sincronizados: €${totalPagosSincronizados.toFixed(2)}`);
    console.log(`    - Gastos sincronizados: €${totalGastosSincronizados.toFixed(2)}`);
    console.log(`    - NETO: €${(totalPagosSincronizados - totalGastosSincronizados).toFixed(2)}`);
    
    console.log(`\n  📉 LO QUE REPORTA GSCONTROL:`);
    console.log(`    - 14 operaciones por €1,442`);
    
    console.log(`\n  ⚠️  PROBLEMA IDENTIFICADO:`);
    console.log(`    - Tenemos ${reservasCobradas.length} reservas cobradas por €${totalCobrado.toFixed(2)}`);
    console.log(`    - Solo ${pagosSincronizados.length} pagos están sincronizados por €${totalPagosSincronizados.toFixed(2)}`);
    console.log(`    - FALTAN sincronizar: ${reservasCobradas.length - pagosSincronizados.length} reservas`);

    console.log(`\n  🔧 SOLUCIÓN:`);
    console.log(`    - Necesitamos sincronizar TODAS las reservas con estado CONFIRMED o COMPLETED`);
    console.log(`    - Cada reserva CONFIRMED/COMPLETED debe tener un pago en BookingPayments`);
    console.log(`    - Ese pago debe estar sincronizado con GSControl (tener gscontrol_id)`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
}

verificar();
