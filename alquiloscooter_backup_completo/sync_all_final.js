require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const GSCONTROL_CONFIG = {
  apiKey: 'gs_69c6c837fac5c6ac12f40efcc44b55e9d2c97d61d3143933aa7390d14683d944',
  endpoint: 'https://gscontrol.abacusai.app/api/integrations/sync',
};

const generateExternalId = (type, id) => {
  const year = new Date().getFullYear();
  return `${type}_${year}_${String(id).padStart(6, '0')}`;
};

async function syncAll() {
  console.log('🚀 SINCRONIZACIÓN MASIVA FINAL\n');

  const allTransactions = [];
  const updates = [];

  // PAGOS
  const payments = await prisma.bookingPayments.findMany({
    where: { gscontrol_id: null },
    include: { booking: { include: { customer: true } } }
  });

  console.log(`💰 Pagos pendientes: ${payments.length}`);

  for (const p of payments) {
    if (!p.booking) continue;

    // IMPORTANTE: externalId basado en PAYMENT ID, no booking ID
    const externalId = generateExternalId('payment', p.id);
    const customerName = p.booking.customer 
      ? `${p.booking.customer.first_name} ${p.booking.customer.last_name}`
      : null;

    allTransactions.push({
      externalId,
      type: 'INGRESO',
      date: p.fecha_pago.toISOString(),
      amount: Number(p.monto),
      ivaRate: 21,
      description: `${p.concepto} - Reserva #${p.booking.booking_number}`,
      documentType: 'NO APLICA',
      ...(customerName && { clientName: customerName }),
      ...(p.booking.customer?.dni_nie && { clientDni: p.booking.customer.dni_nie }),
      metadata: {
        paymentId: p.id,
        bookingId: p.booking_id,
        source: 'ALQUILOSCOOTER'
      }
    });

    updates.push({
      table: 'bookingPayments',
      id: p.id,
      externalId
    });
  }

  // GASTOS DE MANTENIMIENTO (ya sincronizados, solo para verificar)
  const maintenanceExpenses = await prisma.carRentalMaintenanceExpenses.findMany({
    where: { gscontrol_id: null }
  });

  console.log(`🔧 Gastos de mantenimiento pendientes: ${maintenanceExpenses.length}\n`);

  console.log(`📦 Total a sincronizar: ${allTransactions.length}\n`);

  if (allTransactions.length === 0) {
    console.log('✅ Todo ya está sincronizado');
    await prisma.$disconnect();
    return;
  }

  // ENVIAR
  console.log('📤 Enviando...\n');

  const response = await fetch(GSCONTROL_CONFIG.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GSCONTROL_CONFIG.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transactions: allTransactions }),
  });

  const result = await response.json();

  console.log('📥 RESULTADO:');
  console.log(`   Procesadas: ${result.processed}`);
  console.log(`   Exitosas: ${result.results?.success?.length || 0}`);
  console.log(`   Errores: ${result.results?.errors?.length || 0}\n`);

  if (result.results?.errors?.length > 0) {
    console.log('❌ ERRORES:');
    result.results.errors.forEach(err => {
      console.log(`   - ${err.externalId}: ${err.error}`);
    });
    console.log('');
  }

  // ACTUALIZAR DB
  if (result.results?.success?.length > 0) {
    console.log('💾 Actualizando base de datos...\n');

    for (const externalId of result.results.success) {
      const update = updates.find(u => u.externalId === externalId);
      if (!update) continue;

      await prisma.bookingPayments.update({
        where: { id: update.id },
        data: { gscontrol_id: externalId }
      });

      console.log(`✅ Pago ${update.id} actualizado`);
    }
  }

  console.log('\n🎉 SINCRONIZACIÓN COMPLETADA\n');
  await prisma.$disconnect();
}

syncAll().catch(err => {
  console.error('❌ ERROR:', err);
  prisma.$disconnect();
});
