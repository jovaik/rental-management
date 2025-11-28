
/**
 * SINCRONIZACIÓN MASIVA BULK A GSCONTROL
 * Envía TODAS las transacciones de una vez (como Servyauto)
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const GSCONTROL_CONFIG = {
  apiKey: process.env.GSCONTROL_API_KEY || 'gs_69c6c837fac5c6ac12f40efcc44b55e9d2c97d61d3143933aa7390d14683d944',
  endpoint: process.env.GSCONTROL_ENDPOINT || 'https://gscontrol.abacusai.app/api/integrations/sync',
};

// Generar externalId único
const generateExternalId = (type, id) => {
  const year = new Date().getFullYear();
  return `${type}_${year}_${String(id).padStart(6, '0')}`;
};

async function syncBulk() {
  console.log('🚀 INICIANDO SINCRONIZACIÓN MASIVA BULK\n');
  console.log('📍 Endpoint:', GSCONTROL_CONFIG.endpoint);
  console.log('🔑 API Key:', GSCONTROL_CONFIG.apiKey.substring(0, 15) + '...\n');

  const allTransactions = [];
  const updates = [];

  // 1. OBTENER TODOS LOS PAGOS (EXCLUYENDO DEPÓSITOS)
  console.log('📊 1. Obteniendo pagos...');
  console.log('   ⚠️  NOTA: Los depósitos/fianzas NO se sincronizan (se cobran y devuelven)\n');
  const payments = await prisma.bookingPayments.findMany({
    where: { gscontrol_id: null },
    include: {
      booking: {
        include: { customer: true }
      }
    },
    orderBy: { fecha_pago: 'asc' }
  });
  console.log(`   ✅ ${payments.length} pagos pendientes\n`);

  // Convertir pagos a transacciones GSControl
  for (const p of payments) {
    if (!p.booking) continue;

    const externalId = generateExternalId('booking', p.booking_id);
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
        bookingId: p.booking_id,
        paymentId: p.id,
        paymentMethod: p.metodo_pago,
        source: 'ALQUILOSCOOTER'
      }
    });

    updates.push({
      table: 'bookingPayments',
      id: p.id,
      externalId
    });
  }

  // 2. OBTENER GASTOS DE MANTENIMIENTO
  console.log('📊 2. Obteniendo gastos de mantenimiento...');
  const maintenanceExpenses = await prisma.carRentalMaintenanceExpenses.findMany({
    where: { gscontrol_id: null },
    include: {
      maintenance: {
        include: { car: true }
      }
    },
    orderBy: { purchase_date: 'asc' }
  });
  console.log(`   ✅ ${maintenanceExpenses.length} gastos de mantenimiento pendientes\n`);

  // Convertir gastos de mantenimiento a transacciones GSControl
  for (const e of maintenanceExpenses) {
    const externalId = generateExternalId('maintenance_expense', e.id);
    const description = e.description || `${e.item_name} - ${e.maintenance.car.registration_number}`;

    allTransactions.push({
      externalId,
      type: 'GASTO',
      date: (e.purchase_date || e.created_at).toISOString(),
      amount: Number(e.total_price),
      ivaRate: 21,
      description,
      documentType: e.invoice_number ? 'FACTURA' : 'NO APLICA',
      ...(e.invoice_number && { invoiceNumber: e.invoice_number }),
      ...(e.expense_category && { costCategory: e.expense_category }),
      metadata: {
        maintenanceId: e.maintenance_id,
        expenseId: e.id,
        vehicleId: e.maintenance.car_id,
        vehicleRegistration: e.maintenance.car.registration_number,
        source: 'ALQUILOSCOOTER'
      }
    });

    updates.push({
      table: 'carRentalMaintenanceExpenses',
      id: e.id,
      externalId
    });
  }

  // 3. OBTENER GASTOS GENERALES
  console.log('📊 3. Obteniendo gastos generales...');
  const generalExpenses = await prisma.carRentalGastos.findMany({
    where: { gscontrol_id: null },
    include: { vehicle: true },
    orderBy: { fecha: 'asc' }
  });
  console.log(`   ✅ ${generalExpenses.length} gastos generales pendientes\n`);

  // Convertir gastos generales a transacciones GSControl
  for (const g of generalExpenses) {
    const externalId = generateExternalId('expense', g.id);

    allTransactions.push({
      externalId,
      type: 'GASTO',
      date: g.fecha.toISOString(),
      amount: Number(g.total),
      ivaRate: 21,
      description: `${g.categoria} - ${g.descripcion}`,
      documentType: g.tipo_documento === 'FACTURA' ? 'FACTURA' : 'NO APLICA',
      ...(g.categoria && { costCategory: g.categoria }),
      metadata: {
        expenseId: g.id,
        ...(g.vehicle_id && { vehicleId: g.vehicle_id }),
        ...(g.vehicle && { vehicleRegistration: g.vehicle.registration_number }),
        paymentMethod: g.metodo_pago,
        source: 'ALQUILOSCOOTER'
      }
    });

    updates.push({
      table: 'carRentalGastos',
      id: g.id,
      externalId
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log(`📦 TOTAL DE TRANSACCIONES A SINCRONIZAR: ${allTransactions.length}`);
  console.log('='.repeat(80) + '\n');

  if (allTransactions.length === 0) {
    console.log('✅ No hay transacciones pendientes. Todo ya está sincronizado.');
    await prisma.$disconnect();
    return;
  }

  // ENVIAR TODO EN UN SOLO REQUEST (BULK)
  console.log('🚀 Enviando TODAS las transacciones en BULK...\n');

  try {
    const response = await fetch(GSCONTROL_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GSCONTROL_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transactions: allTransactions }),
    });

    const responseText = await response.text();
    console.log('\n📥 RESPUESTA DE GSCONTROL:');
    console.log('Status:', response.status);
    console.log('Body:', responseText);
    console.log('\n');

    if (!response.ok) {
      console.error('❌ ERROR EN LA SINCRONIZACIÓN');
      console.error('Status:', response.status);
      console.error('Response:', responseText);
      await prisma.$disconnect();
      process.exit(1);
    }

    const result = JSON.parse(responseText);

    console.log('✅ RESULTADO:');
    console.log(`   Procesadas: ${result.processed}`);
    console.log(`   Errores: ${result.errors}`);
    console.log(`   Exitosas: ${result.results?.success?.length || 0}`);
    console.log(`   Fallidas: ${result.results?.errors?.length || 0}\n`);

    // Si hay errores, mostrarlos
    if (result.results?.errors?.length > 0) {
      console.log('❌ ERRORES DETALLADOS:');
      result.results.errors.forEach((err, idx) => {
        console.log(`\n   ${idx + 1}. ExternalId: ${err.externalId}`);
        console.log(`      Error: ${err.error}`);
      });
      console.log('\n');
    }

    // ACTUALIZAR BASE DE DATOS CON LOS IDS
    if (result.results?.success?.length > 0) {
      console.log('💾 Actualizando base de datos con los IDs de GSControl...\n');

      const successIds = result.results.success;
      let updated = 0;

      for (const externalId of successIds) {
        // Buscar el update correspondiente
        const updateInfo = updates.find(u => u.externalId === externalId);
        if (!updateInfo) continue;

        try {
          switch (updateInfo.table) {
            case 'bookingPayments':
              await prisma.bookingPayments.update({
                where: { id: updateInfo.id },
                data: { gscontrol_id: externalId }
              });
              break;

            case 'carRentalMaintenanceExpenses':
              await prisma.carRentalMaintenanceExpenses.update({
                where: { id: updateInfo.id },
                data: { gscontrol_id: externalId }
              });
              break;

            case 'carRentalGastos':
              await prisma.carRentalGastos.update({
                where: { id: updateInfo.id },
                data: { gscontrol_id: externalId }
              });
              break;
          }
          updated++;
        } catch (err) {
          console.error(`   ⚠️  Error actualizando ${updateInfo.table} ${updateInfo.id}:`, err.message);
        }
      }

      console.log(`   ✅ ${updated} registros actualizados en la base de datos\n`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎉 SINCRONIZACIÓN MASIVA COMPLETADA');
    console.log('='.repeat(80) + '\n');

    console.log('📊 RESUMEN FINAL:');
    console.log(`   Total intentadas: ${allTransactions.length}`);
    console.log(`   Exitosas: ${result.results?.success?.length || 0}`);
    console.log(`   Fallidas: ${result.results?.errors?.length || 0}`);
    console.log(`   Actualizadas en DB: ${result.results?.success?.length || 0}\n`);

  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO:', error.message);
    console.error(error);
  }

  await prisma.$disconnect();
}

// EJECUTAR
syncBulk().catch(err => {
  console.error('❌ ERROR:', err);
  prisma.$disconnect();
  process.exit(1);
});
