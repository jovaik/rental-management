
/**
 * SINCRONIZAR LOS DEPÓSITOS QUE FALTAN
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

async function syncDeposits() {
  console.log('🚀 SINCRONIZANDO LOS 6 DEPÓSITOS QUE FALTAN\n');

  const allTransactions = [];
  const updates = [];

  try {
    // OBTENER LOS 6 DEPÓSITOS NO SINCRONIZADOS
    const deposits = await prisma.bookingDeposits.findMany({
      where: {
        gscontrol_id: null
      },
      include: {
        booking: {
          select: {
            booking_number: true,
            pickup_date: true,
            return_date: true,
            customer: {
              select: {
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        }
      }
    });

    console.log(`📍 Encontrados ${deposits.length} depósitos no sincronizados\n`);

    for (const deposit of deposits) {
      const externalId = generateExternalId('DEPOSITO', deposit.id);
      const transactionDate = new Date(deposit.fecha_deposito);
      
      const customerName = deposit.booking?.customer 
        ? `${deposit.booking.customer.first_name} ${deposit.booking.customer.last_name}`.trim()
        : 'N/A';
        
      allTransactions.push({
        externalId,
        date: transactionDate.toISOString().split('T')[0],
        amount: parseFloat(deposit.monto_deposito),
        type: 'income',
        category: 'Depósitos',
        description: `Depósito - Reserva ${deposit.booking?.booking_number || 'N/A'} - Cliente: ${customerName}`,
        paymentMethod: deposit.metodo_pago_deposito || 'Tarjeta',
        notes: `Estado: ${deposit.estado}`,
      });

      updates.push({
        table: 'bookingDeposits',
        id: deposit.id,
        externalId
      });

      console.log(`  ✓ Depósito ${deposit.id}: €${deposit.monto_deposito} (${deposit.booking?.booking_number})`);
    }

    if (allTransactions.length === 0) {
      console.log('\n✅ No hay depósitos pendientes de sincronizar');
      await prisma.$disconnect();
      return;
    }

    // ENVIAR TODO A GSCONTROL
    console.log(`\n📤 Enviando ${allTransactions.length} transacciones a GSControl...`);
    
    const response = await fetch(GSCONTROL_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GSCONTROL_CONFIG.apiKey}`,
      },
      body: JSON.stringify({ transactions: allTransactions }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    console.log('\n✅ RESPUESTA DE GSCONTROL:');
    console.log(`   Exitosos: ${result.successful || 0}`);
    console.log(`   Errores: ${result.failed || 0}`);

    if (result.errors && result.errors.length > 0) {
      console.log('\n❌ ERRORES:');
      result.errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.externalId}: ${err.error}`);
      });
    }

    // ACTUALIZAR BASE DE DATOS
    console.log('\n📝 Actualizando base de datos...');
    for (const update of updates) {
      if (update.table === 'bookingDeposits') {
        await prisma.bookingDeposits.update({
          where: { id: update.id },
          data: { gscontrol_id: update.externalId }
        });
        console.log(`   ✓ Depósito ${update.id} marcado como sincronizado`);
      }
    }

    console.log('\n🎉 ¡SINCRONIZACIÓN COMPLETADA!\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.cause) {
      console.error('Causa:', error.cause);
    }
  } finally {
    await prisma.$disconnect();
  }
}

syncDeposits();
