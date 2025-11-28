require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analizar() {
  try {
    const inicio2025 = new Date('2025-01-01');
    const fin2025 = new Date('2025-12-31T23:59:59');

    console.log('🔍 Analizando todas las fuentes de ingresos/gastos en 2025...\n');

    // 1. RESERVAS COMPLETADAS 2025
    const reservas2025 = await prisma.carRentalBookings.findMany({
      where: {
        status: 'Completed',
        return_date: {
          gte: inicio2025,
          lte: fin2025
        }
      },
      include: {
        customer: true,
        payments: true,
        deposit: true
      }
    });

    console.log(`📋 RESERVAS COMPLETADAS 2025: ${reservas2025.length}`);
    console.log('─────────────────────────────────────────────────');
    
    let totalReservas = 0;
    let totalPagos = 0;
    let totalDepositos = 0;
    
    reservas2025.forEach((reserva, index) => {
      const customer = reserva.customer 
        ? `${reserva.customer.first_name} ${reserva.customer.last_name}`
        : 'Sin cliente';
      
      const totalReserva = parseFloat(reserva.total_price || 0);
      const pagosRealizados = reserva.payments?.reduce((sum, p) => sum + parseFloat(p.monto), 0) || 0;
      const deposito = reserva.deposit ? parseFloat(reserva.deposit.monto_deposito) : 0;
      
      totalReservas += totalReserva;
      totalPagos += pagosRealizados;
      totalDepositos += deposito;
      
      console.log(`${index + 1}. [${reserva.booking_number}] ${customer}`);
      console.log(`   Precio total: €${totalReserva.toFixed(2)}`);
      console.log(`   Pagos registrados: €${pagosRealizados.toFixed(2)}`);
      console.log(`   Depósito: €${deposito.toFixed(2)}`);
      console.log(`   Diferencia: €${(totalReserva - pagosRealizados).toFixed(2)}\n`);
    });

    console.log(`\nSUBTOTALES:`);
    console.log(`   Total precio reservas: €${totalReservas.toFixed(2)}`);
    console.log(`   Total pagos registrados: €${totalPagos.toFixed(2)}`);
    console.log(`   Total depósitos (NO SE SINCRONIZAN): €${totalDepositos.toFixed(2)}`);
    console.log(`   Diferencia sin registrar: €${(totalReservas - totalPagos).toFixed(2)}\n`);

    // 2. TODOS LOS PAGOS (incluso de reservas no completadas)
    console.log('\n💰 TODOS LOS PAGOS 2025 (BookingPayments):');
    console.log('─────────────────────────────────────────────────');
    
    const todosPagos = await prisma.bookingPayments.findMany({
      where: {
        fecha_pago: {
          gte: inicio2025,
          lte: fin2025
        }
      }
    });

    const totalTodosPagos = todosPagos.reduce((sum, p) => sum + parseFloat(p.monto), 0);
    console.log(`Total pagos en BookingPayments: €${totalTodosPagos.toFixed(2)}`);
    console.log(`Cantidad: ${todosPagos.length} pagos\n`);

    // 3. TODOS LOS DEPÓSITOS
    console.log('🏦 TODOS LOS DEPÓSITOS 2025:');
    console.log('─────────────────────────────────────────────────');
    
    const todosDepositos = await prisma.bookingDeposits.findMany({
      where: {
        fecha_deposito: {
          gte: inicio2025,
          lte: fin2025
        }
      },
      include: {
        booking: {
          include: {
            customer: true
          }
        }
      }
    });

    let totalDepositosGlobal = 0;
    todosDepositos.forEach((dep, index) => {
      const customer = dep.booking?.customer 
        ? `${dep.booking.customer.first_name} ${dep.booking.customer.last_name}`
        : 'Sin cliente';
      const monto = parseFloat(dep.monto_deposito);
      totalDepositosGlobal += monto;
      console.log(`${index + 1}. ${customer} - €${monto.toFixed(2)} (${dep.estado_devolucion || 'pendiente'})`);
    });

    console.log(`\nTotal depósitos: €${totalDepositosGlobal.toFixed(2)}`);
    console.log(`(Nota: Los depósitos NO deben sincronizarse con GSControl)\n`);

    // 4. RESUMEN FINAL
    console.log('\n═══════════════════════════════════════════════');
    console.log('              📊 RESUMEN COMPLETO');
    console.log('═══════════════════════════════════════════════');
    console.log(`💰 Ingresos reales (Pagos): €${totalTodosPagos.toFixed(2)}`);
    console.log(`🔧 Gastos mantenimiento: €49.68`);
    console.log(`📊 Total transacciones: €${(totalTodosPagos + 49.68).toFixed(2)}`);
    console.log(`\n🏦 Depósitos (NO SE CUENTAN): €${totalDepositosGlobal.toFixed(2)}`);
    console.log(`💡 Total si incluyéramos depósitos: €${(totalTodosPagos + totalDepositosGlobal + 49.68).toFixed(2)}`);
    console.log('═══════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analizar();
