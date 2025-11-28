
/**
 * DIAGNÓSTICO DE MÉTODOS DE PAGO
 * 
 * Muestra un resumen de todas las transacciones sincronizadas
 * con GSControl, agrupadas por método de pago y documentType.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
 * Analizar INGRESOS
 */
async function analizarIngresos() {
  console.log('\n📊 ANÁLISIS DE INGRESOS\n');
  
  const pagos = await prisma.bookingPayments.findMany({
    where: {
      gscontrol_id: {
        not: null
      }
    },
    include: {
      booking: true
    }
  });

  console.log(`Total de ingresos sincronizados: ${pagos.length}\n`);

  // Agrupar por método de pago
  const porMetodo = {};
  let totalImporte = 0;

  for (const pago of pagos) {
    const metodo = pago.metodo_pago || 'SIN_METODO';
    const documentType = getDocumentTypeFromPaymentMethod(pago.metodo_pago);
    const monto = parseFloat(pago.monto);
    
    if (!porMetodo[metodo]) {
      porMetodo[metodo] = {
        cantidad: 0,
        importe: 0,
        documentType: documentType
      };
    }
    
    porMetodo[metodo].cantidad++;
    porMetodo[metodo].importe += monto;
    totalImporte += monto;
  }

  // Mostrar resumen
  console.log('┌─────────────────────┬──────────┬─────────────┬──────────────┐');
  console.log('│ MÉTODO DE PAGO      │ CANTIDAD │   IMPORTE   │ DOCUMENTTYPE │');
  console.log('├─────────────────────┼──────────┼─────────────┼──────────────┤');
  
  for (const [metodo, datos] of Object.entries(porMetodo)) {
    const metodoPadded = metodo.padEnd(19);
    const cantidadPadded = datos.cantidad.toString().padStart(8);
    const importePadded = datos.importe.toFixed(2).padStart(11);
    const docTypePadded = datos.documentType.padEnd(12);
    console.log(`│ ${metodoPadded} │ ${cantidadPadded} │ ${importePadded} │ ${docTypePadded} │`);
  }
  
  console.log('├─────────────────────┼──────────┼─────────────┼──────────────┤');
  console.log(`│ TOTAL               │ ${pagos.length.toString().padStart(8)} │ ${totalImporte.toFixed(2).padStart(11)} │              │`);
  console.log('└─────────────────────┴──────────┴─────────────┴──────────────┘\n');

  return { total: pagos.length, importe: totalImporte };
}

/**
 * Analizar GASTOS
 */
async function analizarGastos() {
  console.log('\n📊 ANÁLISIS DE GASTOS\n');
  
  const gastos = await prisma.carRentalGastos.findMany({
    where: {
      gscontrol_id: {
        not: null
      }
    }
  });

  console.log(`Total de gastos sincronizados: ${gastos.length}\n`);

  // Agrupar por método de pago
  const porMetodo = {};
  let totalImporte = 0;

  for (const gasto of gastos) {
    const metodo = gasto.metodo_pago || 'SIN_METODO';
    const documentType = getDocumentTypeFromPaymentMethod(gasto.metodo_pago);
    const monto = parseFloat(gasto.total);
    
    if (!porMetodo[metodo]) {
      porMetodo[metodo] = {
        cantidad: 0,
        importe: 0,
        documentType: documentType
      };
    }
    
    porMetodo[metodo].cantidad++;
    porMetodo[metodo].importe += monto;
    totalImporte += monto;
  }

  // Mostrar resumen
  console.log('┌─────────────────────┬──────────┬─────────────┬──────────────┐');
  console.log('│ MÉTODO DE PAGO      │ CANTIDAD │   IMPORTE   │ DOCUMENTTYPE │');
  console.log('├─────────────────────┼──────────┼─────────────┼──────────────┤');
  
  for (const [metodo, datos] of Object.entries(porMetodo)) {
    const metodoPadded = metodo.padEnd(19);
    const cantidadPadded = datos.cantidad.toString().padStart(8);
    const importePadded = datos.importe.toFixed(2).padStart(11);
    const docTypePadded = datos.documentType.padEnd(12);
    console.log(`│ ${metodoPadded} │ ${cantidadPadded} │ ${importePadded} │ ${docTypePadded} │`);
  }
  
  console.log('├─────────────────────┼──────────┼─────────────┼──────────────┤');
  console.log(`│ TOTAL               │ ${gastos.length.toString().padStart(8)} │ ${totalImporte.toFixed(2).padStart(11)} │              │`);
  console.log('└─────────────────────┴──────────┴─────────────┴──────────────┘\n');

  return { total: gastos.length, importe: totalImporte };
}

/**
 * MAIN: Ejecutar diagnóstico completo
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║        DIAGNÓSTICO DE MÉTODOS DE PAGO - GSCONTROL        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log('📋 REGLA DE NEGOCIO:');
  console.log('   • EFECTIVO / TPV_SUMUP → TICKET (no va al IVA)');
  console.log('   • TRANSFERENCIA / TARJETA / TPV → FACTURA (sí va al IVA)\n');

  try {
    // Analizar ingresos
    const resultadoIngresos = await analizarIngresos();

    // Analizar gastos
    const resultadoGastos = await analizarGastos();

    // Resumen final
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                    RESUMEN FINAL                          ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log(`📈 INGRESOS:`);
    console.log(`   📊 Transacciones: ${resultadoIngresos.total}`);
    console.log(`   💰 Importe total: ${resultadoIngresos.importe.toFixed(2)}€\n`);

    console.log(`📉 GASTOS:`);
    console.log(`   📊 Transacciones: ${resultadoGastos.total}`);
    console.log(`   💰 Importe total: ${resultadoGastos.importe.toFixed(2)}€\n`);

    console.log(`🎯 TOTAL GENERAL:`);
    console.log(`   📊 ${resultadoIngresos.total + resultadoGastos.total} transacciones sincronizadas con GSControl`);
    console.log(`   💰 Balance: ${(resultadoIngresos.importe - resultadoGastos.importe).toFixed(2)}€\n`);

  } catch (error) {
    console.error('❌ Error en el diagnóstico:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
main()
  .then(() => {
    console.log('✅ Diagnóstico completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el diagnóstico:', error);
    process.exit(1);
  });
