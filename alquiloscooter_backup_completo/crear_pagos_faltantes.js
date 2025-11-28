/**
 * SCRIPT PARA CREAR PAGOS FALTANTES
 * Genera registros en BookingPayments para reservas que no tienen pagos
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function crearPagosFaltantes() {
  console.log('🔧 CREANDO PAGOS FALTANTES PARA RESERVAS\n');
  console.log('='.repeat(80));
  
  // Obtener reservas sin pagos
  const reservasSinPagos = await prisma.carRentalBookings.findMany({
    where: {
      payments: {
        none: {}
      },
      total_price: {
        gt: 0
      }
    },
    include: {
      customer: {
        select: {
          first_name: true,
          last_name: true
        }
      }
    }
  });
  
  console.log(`\n📊 Encontradas ${reservasSinPagos.length} reservas sin pagos registrados\n`);
  
  if (reservasSinPagos.length === 0) {
    console.log('✅ Todas las reservas ya tienen pagos registrados');
    await prisma.$disconnect();
    return;
  }
  
  let creados = 0;
  let errores = 0;
  
  for (const reserva of reservasSinPagos) {
    try {
      const customerName = reserva.customer 
        ? `${reserva.customer.first_name} ${reserva.customer.last_name}`
        : 'Cliente N/A';
      
      const montoPago = Number(reserva.total_price);
      
      // Crear pago
      await prisma.bookingPayments.create({
        data: {
          booking_id: reserva.id,
          concepto: 'Pago de reserva',
          monto: montoPago,
          metodo_pago: 'EFECTIVO', // Método por defecto
          fecha_pago: reserva.pickup_date || new Date(),
          notas: 'Pago generado automáticamente desde total_price de la reserva'
        }
      });
      
      creados++;
      console.log(`   ✅ #${reserva.booking_number || 'null'} | ${customerName.substring(0, 25).padEnd(25)} | €${montoPago.toFixed(2)}`);
      
    } catch (error) {
      errores++;
      console.error(`   ❌ Error en reserva ${reserva.booking_number}: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMEN:');
  console.log('='.repeat(80));
  console.log(`   Pagos creados:  ${creados}`);
  console.log(`   Errores:        ${errores}`);
  console.log('');
  
  // Verificar total después de crear
  const allPayments = await prisma.bookingPayments.findMany();
  const totalPagos = allPayments.reduce((sum, p) => sum + Number(p.monto), 0);
  
  console.log(`✅ TOTAL DE PAGOS AHORA: €${totalPagos.toFixed(2)}\n`);
  
  await prisma.$disconnect();
}

crearPagosFaltantes().catch(err => {
  console.error('❌ ERROR:', err);
  prisma.$disconnect();
  process.exit(1);
});
