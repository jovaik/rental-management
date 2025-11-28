import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Buscando una reserva para probar completar...\n');
  
  // Buscar una reserva 'confirmed' con cliente y documentos
  const booking = await prisma.carRentalBookings.findFirst({
    where: {
      status: 'confirmed',
      customer_id: { not: null }
    },
    include: {
      customer: true,
      vehicles: {
        include: {
          car: true
        }
      }
    },
    orderBy: { id: 'desc' }
  });

  if (!booking) {
    console.log('❌ No hay reservas confirmadas con cliente para probar');
    await prisma.$disconnect();
    return;
  }

  console.log(`📋 Reserva encontrada: #${booking.id} (${booking.booking_number || 'Sin número'})`);
  console.log(`   Cliente: ${booking.customer?.first_name} ${booking.customer?.last_name}`);
  console.log(`   Email: ${booking.customer?.email || 'Sin email'}`);
  console.log(`   Estado actual: ${booking.status}`);
  console.log(`   Total: €${booking.total_price}`);
  console.log('');

  // Verificar documentos del cliente
  const docs = {
    carnet_front: !!booking.customer?.driver_license_front,
    carnet_back: !!booking.customer?.driver_license_back,
    dni_front: !!booking.customer?.id_document_front,
    dni_back: !!booking.customer?.id_document_back
  };

  console.log('📄 Documentos del cliente:');
  console.log(`   Carnet frontal: ${docs.carnet_front ? '✅' : '❌'}`);
  console.log(`   Carnet trasera: ${docs.carnet_back ? '✅' : '❌'}`);
  console.log(`   DNI/NIE frontal: ${docs.dni_front ? '✅' : '❌'}`);
  console.log(`   DNI/NIE trasera: ${docs.dni_back ? '✅' : '❌'}`);
  console.log('');

  const allDocs = Object.values(docs).every(v => v);
  if (!allDocs) {
    console.log('⚠️  FALTAN DOCUMENTOS - pero según el código, esto NO debería impedir completar');
  } else {
    console.log('✅ TODOS los documentos están presentes');
  }
  console.log('');

  // Verificar si ya tiene factura
  const factura = await prisma.carRentalFacturas.findFirst({
    where: { booking_id: booking.id }
  });

  if (factura) {
    console.log(`⚠️  Ya tiene factura: ${factura.numero}`);
  } else {
    console.log('✅ No tiene factura (se puede generar)');
  }
  console.log('');

  // Verificar pagos
  const pagos = await prisma.bookingPayments.findMany({
    where: { booking_id: booking.id }
  });

  const totalPagado = pagos.reduce((sum, p) => sum + parseFloat(p.monto.toString()), 0);
  console.log(`💰 Pagos registrados: ${pagos.length}`);
  console.log(`   Total pagado: €${totalPagado.toFixed(2)}`);
  console.log(`   Total reserva: €${booking.total_price}`);
  console.log(`   Diferencia: €${(parseFloat(booking.total_price.toString()) - totalPagado).toFixed(2)}`);
  console.log('');

  // Verificar depósito
  const deposito = await prisma.bookingDeposits.findFirst({
    where: { booking_id: booking.id }
  });

  if (deposito) {
    console.log(`✅ Depósito registrado: €${deposito.monto} (${deposito.estado})`);
  } else {
    console.log('❌ NO tiene depósito registrado');
  }
  console.log('');

  // Resumen
  console.log('📊 DIAGNÓSTICO:');
  const canComplete = 
    booking.customer_id &&
    totalPagado >= parseFloat(booking.total_price.toString()) &&
    deposito &&
    !factura;

  if (canComplete) {
    console.log('   ✅ Esta reserva PUEDE completarse según la lógica del código');
  } else {
    console.log('   ❌ Esta reserva NO puede completarse por:');
    if (!booking.customer_id) console.log('      - Falta customer_id');
    if (totalPagado < parseFloat(booking.total_price.toString())) {
      console.log(`      - Faltan pagos (€${(parseFloat(booking.total_price.toString()) - totalPagado).toFixed(2)})`);
    }
    if (!deposito) console.log('      - Falta depósito');
    if (factura) console.log('      - Ya tiene factura');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
