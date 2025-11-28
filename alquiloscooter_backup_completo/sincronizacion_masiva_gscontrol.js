
/**
 * SINCRONIZACIÓN MASIVA A GSCONTROL
 * Basado en INSTRUCCIONES_EXACTAS_ALQUILOSCOOTER.pdf - TAREA 2
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Este código debe ejecutarse EN SU SERVIDOR BACKEND
// NO en el navegador del usuario
async function sincronizacionCompletaGSControl() {
  try {
    console.log('🔄 Iniciando sincronización completa con GS Control...\n');
    
    // 1. OBTENER TODAS las transacciones de AlquiloScooter
    console.log('📊 1. Obteniendo TODAS las transacciones...');
    
    // PAGOS (INGRESOS)
    const pagos = await prisma.bookingPayments.findMany({
      where: {
        // Opcional: Solo del año actual
        fecha_pago: {
          gte: new Date('2025-01-01')
        }
      },
      include: {
        booking: {
          include: { customer: true }
        }
      },
      orderBy: { fecha_pago: 'asc' }
    });
    console.log(`   ✅ ${pagos.length} pagos (INGRESOS)`);
    
    // GASTOS DE MANTENIMIENTO
    const gastosMantenimiento = await prisma.carRentalMaintenanceExpenses.findMany({
      where: {
        purchase_date: {
          gte: new Date('2025-01-01')
        }
      },
      include: {
        maintenance: {
          include: { car: true }
        }
      },
      orderBy: { purchase_date: 'asc' }
    });
    console.log(`   ✅ ${gastosMantenimiento.length} gastos de mantenimiento`);
    
    // GASTOS GENERALES
    const gastosGenerales = await prisma.carRentalGastos.findMany({
      where: {
        fecha: {
          gte: new Date('2025-01-01')
        }
      },
      include: { vehicle: true },
      orderBy: { fecha: 'asc' }
    });
    console.log(`   ✅ ${gastosGenerales.length} gastos generales\n`);

    // 2. FORMATEAR al formato de GS Control
    console.log('📋 2. Formateando transacciones...');
    const transaccionesFormateadas = [];
    
    // Convertir PAGOS a formato GSControl
    for (const p of pagos) {
      if (!p.booking) continue;
      
      const customerName = p.booking.customer 
        ? `${p.booking.customer.first_name} ${p.booking.customer.last_name}`
        : null;
      
      transaccionesFormateadas.push({
        externalId: `booking_2025_${String(p.booking_id).padStart(6, '0')}`,
        type: "INGRESO",
        date: p.fecha_pago.toISOString().split('T')[0], // Formato YYYY-MM-DD
        amount: Number(p.monto),
        description: `${p.concepto} - Reserva #${p.booking.booking_number}`,
        ivaRate: 21
      });
    }
    
    // Convertir GASTOS DE MANTENIMIENTO a formato GSControl
    for (const e of gastosMantenimiento) {
      const description = e.description || `${e.item_name} - ${e.maintenance.car.registration_number}`;
      
      transaccionesFormateadas.push({
        externalId: `maintenance_expense_2025_${String(e.id).padStart(6, '0')}`,
        type: "GASTO",
        date: (e.purchase_date || e.created_at).toISOString().split('T')[0],
        amount: Number(e.total_price),
        description: description,
        ivaRate: 21
      });
    }
    
    // Convertir GASTOS GENERALES a formato GSControl
    for (const g of gastosGenerales) {
      transaccionesFormateadas.push({
        externalId: `expense_2025_${String(g.id).padStart(6, '0')}`,
        type: "GASTO",
        date: g.fecha.toISOString().split('T')[0],
        amount: Number(g.total),
        description: `${g.categoria} - ${g.descripcion}`,
        ivaRate: 21
      });
    }
    
    console.log(`   ✅ ${transaccionesFormateadas.length} transacciones formateadas\n`);

    // 3. ENVIAR TODO a GS Control
    console.log('🚀 3. Enviando TODO a GS Control...\n');
    console.log(`   📍 Endpoint: https://gscontrol.abacusai.app/api/integrations/pull`);
    console.log(`   📦 Enviando ${transaccionesFormateadas.length} transacciones...\n`);
    
    const response = await fetch('https://gscontrol.abacusai.app/api/integrations/pull', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer gs_69c6c837fac5c6ac12f40efcc44b55e9d2c97d61d3143933aa7390d14683d944',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transactions: transaccionesFormateadas
      })
    });

    const responseText = await response.text();
    console.log('📥 RESPUESTA DE GSCONTROL:');
    console.log('   Status:', response.status);
    console.log('   Body:', responseText);
    console.log('\n');

    if (!response.ok) {
      console.error('❌ Error en sincronización completa:', responseText);
      await prisma.$disconnect();
      process.exit(1);
    } else {
      const resultado = JSON.parse(responseText);
      console.log('✅ Sincronización completa exitosa:', resultado);
      
      console.log('\n' + '='.repeat(80));
      console.log('🎉 SINCRONIZACIÓN MASIVA COMPLETADA');
      console.log('='.repeat(80) + '\n');
      
      console.log('📊 RESUMEN FINAL:');
      console.log(`   Total transacciones enviadas: ${transaccionesFormateadas.length}`);
      console.log(`   Ingresos: ${pagos.length}`);
      console.log(`   Gastos de mantenimiento: ${gastosMantenimiento.length}`);
      console.log(`   Gastos generales: ${gastosGenerales.length}\n`);
    }
    
  } catch (error) {
    console.error('❌ Error fatal en sincronización:', error);
    await prisma.$disconnect();
    process.exit(1);
  }

  await prisma.$disconnect();
}

// EJECUTAR INMEDIATAMENTE
console.log('🛴 ALQUILOSCOOTER - SINCRONIZACIÓN MASIVA A GSCONTROL\n');
console.log('📋 Basado en: INSTRUCCIONES_EXACTAS_ALQUILOSCOOTER.pdf - TAREA 2\n');
console.log('='.repeat(80) + '\n');

sincronizacionCompletaGSControl().catch(err => {
  console.error('❌ ERROR:', err);
  prisma.$disconnect();
  process.exit(1);
});
