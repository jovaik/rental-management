
/**
 * SCRIPT DE SINCRONIZACIÓN MASIVA DE DOCUMENTTYPE
 * 
 * Actualiza todas las transacciones históricas en GSControl
 * con el documentType correcto según el método de pago.
 * 
 * REGLA DE NEGOCIO:
 * - EFECTIVO / TPV_SUMUP → TICKET (no va al IVA)
 * - TRANSFERENCIA / TARJETA / TPV → FACTURA (sí va al IVA)
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Configuración GSControl
const GSCONTROL_API_KEY = 'gs_69c6c837fac5c6ac12f40efcc44b55e9d2c97d61d3143933aa7390d14683d944';
const GSCONTROL_BASE_URL = 'https://gscontrol.abacusai.app';

/**
 * Determina el documentType según el método de pago
 */
function getDocumentTypeFromPaymentMethod(paymentMethod) {
  if (!paymentMethod) return 'FACTURA'; // Por defecto FACTURA
  
  const method = paymentMethod.toUpperCase();
  
  // TICKET: efectivo o TPV SumUp
  if (method === 'EFECTIVO' || method === 'TPV_SUMUP' || method === 'SUMUP') {
    return 'TICKET';
  }
  
  // FACTURA: transferencia o tarjeta/TPV nacional
  if (method === 'TRANSFERENCIA' || method === 'TARJETA' || method === 'TPV' || method === 'BIZUM') {
    return 'FACTURA';
  }
  
  // Por defecto, FACTURA (más seguro para IVA)
  return 'FACTURA';
}

/**
 * Actualiza una transacción en GSControl
 */
async function actualizarTransaccionGSControl(transaccion) {
  try {
    const response = await fetch(`${GSCONTROL_BASE_URL}/api/integrations/ingest`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GSCONTROL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transaccion)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error actualizando ${transaccion.externalId}:`, errorText);
      return false;
    }

    console.log(`✅ Actualizado: ${transaccion.externalId} → ${transaccion.documentType}`);
    return true;
  } catch (error) {
    console.error(`❌ Error en ${transaccion.externalId}:`, error.message);
    return false;
  }
}

/**
 * Sincronizar INGRESOS (BookingPayments)
 */
async function sincronizarIngresos() {
  console.log('\n📊 SINCRONIZANDO INGRESOS...\n');
  
  const pagos = await prisma.bookingPayments.findMany({
    where: {
      gscontrol_id: {
        not: null
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

  console.log(`Total de ingresos a procesar: ${pagos.length}\n`);

  let actualizados = 0;
  let errores = 0;

  for (const pago of pagos) {
    const documentType = getDocumentTypeFromPaymentMethod(pago.metodo_pago);
    
    const transaccion = {
      externalId: pago.gscontrol_id,
      type: 'INGRESO',
      date: pago.fecha_pago.toISOString().split('T')[0],
      amount: parseFloat(pago.monto),
      description: pago.concepto || `Pago de reserva ${pago.booking?.booking_number || ''}`,
      ivaRate: 21,
      documentType: documentType
    };

    // Si es FACTURA, agregar número de factura
    if (documentType === 'FACTURA' && pago.invoice_number) {
      transaccion.invoiceNumber = pago.invoice_number;
    }

    // Datos del cliente (opcional)
    if (pago.booking?.customer) {
      transaccion.clientName = `${pago.booking.customer.first_name} ${pago.booking.customer.last_name}`;
      transaccion.clientDni = pago.booking.customer.dni_nie;
    }

    const resultado = await actualizarTransaccionGSControl(transaccion);
    
    if (resultado) {
      actualizados++;
    } else {
      errores++;
    }

    // Pausa de 100ms entre requests para no saturar la API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n✅ Ingresos actualizados: ${actualizados}`);
  console.log(`❌ Errores: ${errores}\n`);

  return { actualizados, errores };
}

/**
 * Sincronizar GASTOS (carRentalGastos)
 */
async function sincronizarGastos() {
  console.log('\n📊 SINCRONIZANDO GASTOS...\n');

  // Mapeo de categorías
  const EXPENSE_CATEGORY_MAP = {
    'Mantenimiento': 'TALLERES',
    'Combustible': 'COMBUSTIBLE',
    'Seguros': 'SEGUROS',
    'Impuestos': 'GESTORIA',
    'Repuestos': 'REPUESTOS',
    'Otros': 'OTROS GASTOS'
  };
  
  const gastos = await prisma.carRentalGastos.findMany({
    where: {
      gscontrol_id: {
        not: null
      }
    }
  });

  console.log(`Total de gastos a procesar: ${gastos.length}\n`);

  let actualizados = 0;
  let errores = 0;

  for (const gasto of gastos) {
    const documentType = getDocumentTypeFromPaymentMethod(gasto.metodo_pago);
    
    const transaccion = {
      externalId: gasto.gscontrol_id,
      type: 'GASTO',
      date: gasto.fecha.toISOString().split('T')[0],
      amount: parseFloat(gasto.total),
      description: gasto.descripcion,
      ivaRate: 21,
      documentType: documentType
    };

    // Categoría del gasto
    if (gasto.categoria) {
      transaccion.costCategory = EXPENSE_CATEGORY_MAP[gasto.categoria] || 'OTROS GASTOS';
    }

    // Si es FACTURA, agregar número de factura
    if (documentType === 'FACTURA' && gasto.numero_factura) {
      transaccion.invoiceNumber = gasto.numero_factura;
    }

    const resultado = await actualizarTransaccionGSControl(transaccion);
    
    if (resultado) {
      actualizados++;
    } else {
      errores++;
    }

    // Pausa de 100ms entre requests para no saturar la API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n✅ Gastos actualizados: ${actualizados}`);
  console.log(`❌ Errores: ${errores}\n`);

  return { actualizados, errores };
}

/**
 * MAIN: Ejecutar sincronización completa
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   SINCRONIZACIÓN MASIVA DE DOCUMENTTYPE - GSCONTROL      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log('📋 REGLA DE NEGOCIO:');
  console.log('   • EFECTIVO / TPV_SUMUP → TICKET (no va al IVA)');
  console.log('   • TRANSFERENCIA / TARJETA / TPV → FACTURA (sí va al IVA)\n');

  try {
    // Sincronizar ingresos
    const resultadoIngresos = await sincronizarIngresos();

    // Sincronizar gastos
    const resultadoGastos = await sincronizarGastos();

    // Resumen final
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                    RESUMEN FINAL                          ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log(`📈 INGRESOS:`);
    console.log(`   ✅ Actualizados: ${resultadoIngresos.actualizados}`);
    console.log(`   ❌ Errores: ${resultadoIngresos.errores}\n`);

    console.log(`📉 GASTOS:`);
    console.log(`   ✅ Actualizados: ${resultadoGastos.actualizados}`);
    console.log(`   ❌ Errores: ${resultadoGastos.errores}\n`);

    console.log(`🎯 TOTAL:`);
    console.log(`   ✅ ${resultadoIngresos.actualizados + resultadoGastos.actualizados} transacciones actualizadas`);
    console.log(`   ❌ ${resultadoIngresos.errores + resultadoGastos.errores} errores\n`);

    console.log('✅ SINCRONIZACIÓN COMPLETADA\n');
    console.log('📊 Ahora puedes verificar en GSControl que todas las transacciones');
    console.log('   tengan el documentType correcto según el método de pago.\n');

  } catch (error) {
    console.error('❌ Error fatal en la sincronización:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
main()
  .then(() => {
    console.log('✅ Script finalizado correctamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script finalizado con errores:', error);
    process.exit(1);
  });
