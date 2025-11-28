
/**
 * DIAGNÓSTICO COMPLETO DE TRANSACCIONES
 * 
 * Muestra TODAS las transacciones (sincronizadas y no sincronizadas)
 * para identificar cuáles faltan en GSControl.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Determina el documentType según el método de pago
 */
function getDocumentTypeFromPaymentMethod(paymentMethod) {
  if (!paymentMethod) return 'FACTURA';
  
  const method = paymentMethod.toUpperCase();
  
  if (method === 'EFECTIVO' || method === 'TPV_SUMUP' || method === 'SUMUP') {
    return 'TICKET';
  }
  
  if (method === 'TRANSFERENCIA' || method === 'TARJETA' || method === 'TPV' || method === 'BIZUM') {
    return 'FACTURA';
  }
  
  return 'FACTURA';
}

/**
 * Analizar TODAS las transacciones de ingresos (año 2025)
 */
async function analizarTodosIngresos() {
  console.log('\n📊 ANÁLISIS COMPLETO DE INGRESOS (2025)\n');
  
  const pagos = await prisma.bookingPayments.findMany({
    where: {
      fecha_pago: {
        gte: new Date('2025-01-01'),
        lt: new Date('2026-01-01')
      }
    },
    include: {
      booking: true
    }
  });

  const conGSControl = pagos.filter(p => p.gscontrol_id !== null);
  const sinGSControl = pagos.filter(p => p.gscontrol_id === null);

  console.log(`Total de ingresos 2025: ${pagos.length}`);
  console.log(`  ✅ Con GSControl ID: ${conGSControl.length}`);
  console.log(`  ❌ Sin GSControl ID: ${sinGSControl.length}\n`);

  // Analizar por método de pago
  console.log('┌────────────────┬──────┬───────────┬──────────────┐');
  console.log('│ MÉTODO         │ CANT │  IMPORTE  │ DOCUMENTTYPE │');
  console.log('├────────────────┼──────┼───────────┼──────────────┤');
  
  const porMetodo = {};
  let totalImporte = 0;

  for (const pago of pagos) {
    const metodo = pago.metodo_pago || 'SIN_METODO';
    const documentType = getDocumentTypeFromPaymentMethod(pago.metodo_pago);
    const monto = parseFloat(pago.monto);
    
    if (!porMetodo[metodo]) {
      porMetodo[metodo] = { cantidad: 0, importe: 0, documentType };
    }
    
    porMetodo[metodo].cantidad++;
    porMetodo[metodo].importe += monto;
    totalImporte += monto;
  }

  for (const [metodo, datos] of Object.entries(porMetodo)) {
    console.log(`│ ${metodo.padEnd(14)} │ ${datos.cantidad.toString().padStart(4)} │ ${datos.importe.toFixed(2).padStart(9)} │ ${datos.documentType.padEnd(12)} │`);
  }
  
  console.log('├────────────────┼──────┼───────────┼──────────────┤');
  console.log(`│ TOTAL          │ ${pagos.length.toString().padStart(4)} │ ${totalImporte.toFixed(2).padStart(9)} │              │`);
  console.log('└────────────────┴──────┴───────────┴──────────────┘\n');

  // Mostrar transacciones SIN gscontrol_id
  if (sinGSControl.length > 0) {
    console.log('⚠️  TRANSACCIONES SIN SINCRONIZAR CON GSCONTROL:\n');
    for (const pago of sinGSControl) {
      const fecha = pago.fecha_pago.toISOString().split('T')[0];
      const metodo = pago.metodo_pago || 'SIN_METODO';
      const docType = getDocumentTypeFromPaymentMethod(pago.metodo_pago);
      console.log(`   ID: ${pago.id} | Fecha: ${fecha} | Método: ${metodo} | Importe: ${pago.monto}€ | DocType: ${docType}`);
    }
    console.log('');
  }

  return { total: pagos.length, conGSControl: conGSControl.length, sinGSControl: sinGSControl.length, importe: totalImporte };
}

/**
 * Analizar TODOS los gastos (año 2025)
 */
async function analizarTodosGastos() {
  console.log('\n📊 ANÁLISIS COMPLETO DE GASTOS (2025)\n');
  
  const gastos = await prisma.carRentalGastos.findMany({
    where: {
      fecha: {
        gte: new Date('2025-01-01'),
        lt: new Date('2026-01-01')
      }
    }
  });

  const conGSControl = gastos.filter(g => g.gscontrol_id !== null);
  const sinGSControl = gastos.filter(g => g.gscontrol_id === null);

  console.log(`Total de gastos 2025: ${gastos.length}`);
  console.log(`  ✅ Con GSControl ID: ${conGSControl.length}`);
  console.log(`  ❌ Sin GSControl ID: ${sinGSControl.length}\n`);

  // Analizar por método de pago
  console.log('┌────────────────┬──────┬───────────┬──────────────┐');
  console.log('│ MÉTODO         │ CANT │  IMPORTE  │ DOCUMENTTYPE │');
  console.log('├────────────────┼──────┼───────────┼──────────────┤');
  
  const porMetodo = {};
  let totalImporte = 0;

  for (const gasto of gastos) {
    const metodo = gasto.metodo_pago || 'SIN_METODO';
    const documentType = getDocumentTypeFromPaymentMethod(gasto.metodo_pago);
    const monto = parseFloat(gasto.total);
    
    if (!porMetodo[metodo]) {
      porMetodo[metodo] = { cantidad: 0, importe: 0, documentType };
    }
    
    porMetodo[metodo].cantidad++;
    porMetodo[metodo].importe += monto;
    totalImporte += monto;
  }

  for (const [metodo, datos] of Object.entries(porMetodo)) {
    console.log(`│ ${metodo.padEnd(14)} │ ${datos.cantidad.toString().padStart(4)} │ ${datos.importe.toFixed(2).padStart(9)} │ ${datos.documentType.padEnd(12)} │`);
  }
  
  console.log('├────────────────┼──────┼───────────┼──────────────┤');
  console.log(`│ TOTAL          │ ${gastos.length.toString().padStart(4)} │ ${totalImporte.toFixed(2).padStart(9)} │              │`);
  console.log('└────────────────┴──────┴───────────┴──────────────┘\n');

  // Mostrar gastos SIN gscontrol_id
  if (sinGSControl.length > 0) {
    console.log('⚠️  GASTOS SIN SINCRONIZAR CON GSCONTROL:\n');
    for (const gasto of sinGSControl) {
      const fecha = gasto.fecha.toISOString().split('T')[0];
      const metodo = gasto.metodo_pago || 'SIN_METODO';
      const docType = getDocumentTypeFromPaymentMethod(gasto.metodo_pago);
      console.log(`   ID: ${gasto.id} | Fecha: ${fecha} | Método: ${metodo} | Importe: ${gasto.total}€ | DocType: ${docType} | Desc: ${gasto.descripcion}`);
    }
    console.log('');
  }

  return { total: gastos.length, conGSControl: conGSControl.length, sinGSControl: sinGSControl.length, importe: totalImporte };
}

/**
 * MAIN
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     DIAGNÓSTICO COMPLETO DE TRANSACCIONES - GSCONTROL    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    const resultadoIngresos = await analizarTodosIngresos();
    const resultadoGastos = await analizarTodosGastos();

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                    RESUMEN FINAL                          ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log(`📈 INGRESOS 2025:`);
    console.log(`   📊 Total: ${resultadoIngresos.total} transacciones`);
    console.log(`   ✅ Sincronizadas: ${resultadoIngresos.conGSControl}`);
    console.log(`   ❌ Sin sincronizar: ${resultadoIngresos.sinGSControl}`);
    console.log(`   💰 Importe: ${resultadoIngresos.importe.toFixed(2)}€\n`);

    console.log(`📉 GASTOS 2025:`);
    console.log(`   📊 Total: ${resultadoGastos.total} transacciones`);
    console.log(`   ✅ Sincronizadas: ${resultadoGastos.conGSControl}`);
    console.log(`   ❌ Sin sincronizar: ${resultadoGastos.sinGSControl}`);
    console.log(`   💰 Importe: ${resultadoGastos.importe.toFixed(2)}€\n`);

    console.log(`🎯 TOTAL GENERAL 2025:`);
    console.log(`   📊 ${resultadoIngresos.total + resultadoGastos.total} transacciones`);
    console.log(`   ✅ ${resultadoIngresos.conGSControl + resultadoGastos.conGSControl} sincronizadas con GSControl`);
    console.log(`   ❌ ${resultadoIngresos.sinGSControl + resultadoGastos.sinGSControl} sin sincronizar`);
    console.log(`   💰 Balance: ${(resultadoIngresos.importe - resultadoGastos.importe).toFixed(2)}€\n`);

    if (resultadoIngresos.sinGSControl + resultadoGastos.sinGSControl > 0) {
      console.log('⚠️  IMPORTANTE: Hay transacciones sin sincronizar.');
      console.log('   Si quieres sincronizarlas, ejecuta el script de sincronización histórica.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('✅ Diagnóstico completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
