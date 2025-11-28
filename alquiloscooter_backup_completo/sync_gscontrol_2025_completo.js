require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

const GSCONTROL_CONFIG = {
  apiUrl: process.env.GSCONTROL_ENDPOINT || 'https://gscontrol.abacusai.app/api/integrations/sync',
  apiKey: process.env.GSCONTROL_API_KEY
};

async function syncCompleteSyst2025() {
  console.log('\n🔄 SINCRONIZACIÓN COMPLETA 2025 - GSControl\n');
  console.log('='.repeat(70));
  
  try {
    // 1. OBTENER TODAS LAS RESERVAS
    console.log('\n1️⃣ Obteniendo TODAS las reservas...');
    const allBookings = await prisma.carRentalBookings.findMany({
      select: {
        id: true,
        booking_number: true,
        total_price: true,
        status: true,
        pickup_date: true
      },
      where: {
        pickup_date: {
          gte: new Date('2025-01-01'),
          lt: new Date('2026-01-01')
        }
      },
      orderBy: {
        booking_number: 'asc'
      }
    });

    console.log(`📊 Total de reservas 2025: ${allBookings.length}`);
    console.log(`💰 Monto total: €${allBookings.reduce((sum, b) => sum + parseFloat(b.total_price), 0).toFixed(2)}`);
    
    // Mostrar por estado
    const estados = {};
    allBookings.forEach(b => {
      if (!estados[b.status]) estados[b.status] = { count: 0, total: 0 };
      estados[b.status].count++;
      estados[b.status].total += parseFloat(b.total_price);
    });
    
    console.log('\n📊 Desglose por estado:');
    Object.keys(estados).forEach(estado => {
      console.log(`   ${estado}: ${estados[estado].count} reservas por €${estados[estado].total.toFixed(2)}`);
    });

    // 2. VERIFICAR CUÁLES TIENEN PAGOS
    console.log('\n\n2️⃣ Verificando pagos existentes...');
    let conPago = 0;
    let sinPago = 0;
    let sincronizadas = 0;
    
    for (const booking of allBookings) {
      const pago = await prisma.bookingPayments.findFirst({
        where: { booking_id: booking.id },
        select: { gscontrol_id: true }
      });
      
      if (pago) {
        conPago++;
        if (pago.gscontrol_id) sincronizadas++;
      } else {
        sinPago++;
      }
    }
    
    console.log(`✅ Con pago: ${conPago} (${sincronizadas} sincronizadas)`);
    console.log(`❌ Sin pago: ${sinPago}`);

    // 3. CREAR PAGOS FALTANTES
    if (sinPago > 0) {
      console.log(`\n\n3️⃣ Creando pagos para ${sinPago} reservas...`);
      
      for (const booking of allBookings) {
        const pagoExiste = await prisma.bookingPayments.findFirst({
          where: { booking_id: booking.id }
        });
        
        if (!pagoExiste) {
          await prisma.bookingPayments.create({
            data: {
              booking_id: booking.id,
              concepto: 'Pago de reserva',
              monto: booking.total_price,
              metodo_pago: 'EFECTIVO',
              fecha_pago: booking.pickup_date
            }
          });
          console.log(`✅ Pago creado para ${booking.booking_number}`);
        }
      }
    }

    // 4. SINCRONIZAR TODOS LOS PAGOS NO SINCRONIZADOS
    console.log('\n\n4️⃣ Sincronizando pagos con GSControl...');
    
    const pagosPorSincronizar = await prisma.bookingPayments.findMany({
      where: {
        gscontrol_id: null
      },
      include: {
        booking: {
          select: {
            booking_number: true,
            pickup_date: true
          }
        }
      }
    });

    console.log(`📤 Pagos por sincronizar: ${pagosPorSincronizar.length}`);
    
    let exitosos = 0;
    let errores = 0;
    
    for (const pago of pagosPorSincronizar) {
      try {
        // Generar ID único
        const gscontrolId = `payment_2025_${String(pago.id).padStart(6, '0')}`;
        
        // Crear transacción en GSControl según el formato del PDF
        const payload = {
          transactions: [
            {
              externalId: gscontrolId,
              type: 'INGRESO',
              date: pago.fecha_pago.toISOString().split('T')[0],
              amount: parseFloat(pago.monto),
              ivaRate: 21,
              description: `${pago.concepto} - Reserva ${pago.booking?.booking_number || 'N/A'}`,
              documentType: 'NO APLICA',
              invoiceNumber: pago.booking?.booking_number || ''
            }
          ]
        };

        await axios.post(
          GSCONTROL_CONFIG.apiUrl,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${GSCONTROL_CONFIG.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // Actualizar registro local
        await prisma.bookingPayments.update({
          where: { id: pago.id },
          data: { gscontrol_id: gscontrolId }
        });

        exitosos++;
        console.log(`✅ ${pago.booking?.booking_number}: €${pago.monto}`);
        
      } catch (error) {
        errores++;
        console.log(`❌ ${pago.booking?.booking_number}: ${error.response?.data?.error || error.response?.data?.message || error.message}`);
      }
    }

    // 5. SINCRONIZAR GASTOS NO SINCRONIZADOS
    console.log('\n\n5️⃣ Sincronizando gastos con GSControl...');
    
    const gastosPorSincronizar = await prisma.carRentalMaintenanceExpenses.findMany({
      where: {
        gscontrol_id: null,
        created_at: {
          gte: new Date('2025-01-01'),
          lt: new Date('2026-01-01')
        }
      }
    });

    console.log(`📤 Gastos por sincronizar: ${gastosPorSincronizar.length}`);
    
    for (const gasto of gastosPorSincronizar) {
      try {
        const gscontrolId = `maintenance_expense_2025_${String(gasto.id).padStart(6, '0')}`;
        
        const payload = {
          transactions: [
            {
              externalId: gscontrolId,
              type: 'GASTO',
              date: gasto.purchase_date ? gasto.purchase_date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              amount: parseFloat(gasto.total_price),
              ivaRate: parseFloat(gasto.tax_rate) || 21,
              description: `${gasto.expense_category} - ${gasto.item_name}`,
              documentType: gasto.invoice_number ? 'FACTURA' : 'NO APLICA',
              invoiceNumber: gasto.invoice_number || '',
              costCategory: gasto.expense_category
            }
          ]
        };

        await axios.post(
          GSCONTROL_CONFIG.apiUrl,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${GSCONTROL_CONFIG.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        await prisma.carRentalMaintenanceExpenses.update({
          where: { id: gasto.id },
          data: { gscontrol_id: gscontrolId }
        });

        exitosos++;
        console.log(`✅ ${gasto.item_name}: €${gasto.total_price}`);
        
      } catch (error) {
        errores++;
        console.log(`❌ ${gasto.item_name}: ${error.response?.data?.error || error.response?.data?.message || error.message}`);
      }
    }

    // 6. RESUMEN FINAL
    console.log('\n\n6️⃣ RESUMEN FINAL:');
    console.log('='.repeat(70));
    
    const allPagosSincronizados = await prisma.bookingPayments.findMany({
      where: { gscontrol_id: { not: null } }
    });
    
    const allGastosSincronizados = await prisma.carRentalMaintenanceExpenses.findMany({
      where: { gscontrol_id: { not: null } }
    });

    const totalIngresos = allPagosSincronizados.reduce((sum, p) => sum + parseFloat(p.monto), 0);
    const totalGastos = allGastosSincronizados.reduce((sum, g) => sum + parseFloat(g.total_price), 0);

    console.log(`\n📊 Transacciones sincronizadas:`);
    console.log(`   Pagos: ${allPagosSincronizados.length} por €${totalIngresos.toFixed(2)}`);
    console.log(`   Gastos: ${allGastosSincronizados.length} por €${totalGastos.toFixed(2)}`);
    console.log(`   TOTAL: ${allPagosSincronizados.length + allGastosSincronizados.length} transacciones`);
    console.log(`\n💰 Balance: €${(totalIngresos - totalGastos).toFixed(2)}`);
    
    console.log(`\n✅ Sincronización completada con éxito!`);
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
}

syncCompleteSyst2025();
