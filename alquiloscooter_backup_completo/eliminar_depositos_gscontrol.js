require('dotenv').config();

const { PrismaClient } = require('.prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 VERIFICANDO QUÉ SE SINCRONIZÓ CON GSCONTROL...\n');

    // Ver todas las reservas con gscontrol_id
    const bookingsSync = await prisma.carRentalBookings.findMany({
      where: {
        gscontrol_id: { not: null }
      },
      select: {
        id: true,
        bookingNumber: true,
        depositAmount: true,
        finalTotal: true,
        totalPaid: true,
        gscontrol_id: true,
        startDate: true
      },
      orderBy: { startDate: 'desc' }
    });

    console.log(`📊 RESERVAS sincronizadas: ${bookingsSync.length}\n`);

    let depositosIncorrectos = 0;
    let ingresosCorrectos = 0;
    const depositosEliminar = [];

    for (const booking of bookingsSync) {
      const deposito = parseFloat(booking.depositAmount || 0);
      const totalPagado = parseFloat(booking.totalPaid || 0);
      const finalTotal = parseFloat(booking.finalTotal || 0);

      console.log(`Reserva: ${booking.bookingNumber}`);
      console.log(`  Fecha: ${booking.startDate.toISOString().split('T')[0]}`);
      console.log(`  Depósito: €${deposito}`);
      console.log(`  Total Final: €${finalTotal}`);
      console.log(`  Total Pagado: €${totalPagado}`);
      console.log(`  GSControl ID: ${booking.gscontrol_id}`);

      // CRITERIO: Si solo hay depósito sin pago real, es incorrecto
      if (deposito > 0 && totalPagado === 0) {
        console.log(`  ⚠️  DEPÓSITO SINCRONIZADO COMO INGRESO - INCORRECTO`);
        depositosIncorrectos++;
        depositosEliminar.push({
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
          gscontrolId: booking.gscontrol_id,
          amount: deposito
        });
      } else if (totalPagado > 0) {
        console.log(`  ✅ Ingreso correcto (pago real)`);
        ingresosCorrectos++;
      }
      
      console.log('---\n');
    }

    // Ver gastos sincronizados
    const expensesSync = await prisma.carRentalMaintenanceExpenses.findMany({
      where: {
        gscontrol_id: { not: null }
      },
      select: {
        id: true,
        amount: true,
        type: true,
        description: true,
        gscontrol_id: true,
        date: true
      },
      orderBy: { date: 'desc' }
    });

    console.log(`\n📊 GASTOS sincronizados: ${expensesSync.length}\n`);

    for (const expense of expensesSync) {
      console.log(`Gasto: ${expense.type}`);
      console.log(`  Descripción: ${expense.description || 'N/A'}`);
      console.log(`  Importe: €${expense.amount}`);
      console.log(`  GSControl ID: ${expense.gscontrol_id}`);
      console.log('---\n');
    }

    console.log('\n=== RESUMEN ===');
    console.log(`Total reservas sincronizadas: ${bookingsSync.length}`);
    console.log(`  - Ingresos correctos: ${ingresosCorrectos}`);
    console.log(`  - Depósitos incorrectos: ${depositosIncorrectos}`);
    console.log(`Total gastos sincronizados: ${expensesSync.length}`);

    if (depositosIncorrectos > 0) {
      console.log(`\n\n❌ SE DETECTARON ${depositosIncorrectos} DEPÓSITOS SINCRONIZADOS COMO INGRESOS`);
      console.log('\n📋 LISTA COMPLETA DE DEPÓSITOS A ELIMINAR DE GSCONTROL:');
      depositosEliminar.forEach(d => {
        console.log(`  - Reserva ${d.bookingNumber}: €${d.amount} (GSControl ID: ${d.gscontrolId})`);
      });
      
      console.log('\n\n⚠️  ESTOS DEPÓSITOS SON FIANZAS, NO INGRESOS');
      console.log('⚠️  DEBEN SER ELIMINADOS DE GSCONTROL');
      
      // Ahora voy a eliminarlos de la base de datos local
      console.log('\n🔥 ELIMINANDO MARCAS DE SINCRONIZACIÓN EN LA BASE DE DATOS...');
      
      for (const d of depositosEliminar) {
        await prisma.carRentalBookings.update({
          where: { id: d.bookingId },
          data: { gscontrol_id: null }
        });
        console.log(`✅ Limpiado: ${d.bookingNumber}`);
      }
      
      console.log('\n✅ TODOS LOS DEPÓSITOS HAN SIDO MARCADOS COMO NO SINCRONIZADOS');
      console.log('\n⚠️  NOTA: Los depósitos aún existen en GSControl.');
      console.log('⚠️  Debes eliminarlos manualmente desde el panel de GSControl');
      console.log('⚠️  O contactar con GSControl para que los eliminen en masa');
      
    } else {
      console.log('\n✅ NO se encontraron depósitos sincronizados incorrectamente');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
