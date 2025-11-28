import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simular la función syncToGSControl
async function testSyncToGSControl() {
  const API_KEY = 'gs_69c6c837fac5c6ac12f40efcc44b55e9d2c97d61d3143933aa7390d14683d944';
  const ENDPOINT = 'https://gscontrol.abacusai.app/api/integrations/sync';

  console.log('🔍 PRUEBA DEL CONECTOR GSCONTROL\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Obtener una reserva real para probar
  const booking = await prisma.carRentalBookings.findFirst({
    where: { status: 'CONFIRMED' },
    include: { customer: true }
  });

  if (!booking) {
    console.log('⚠️  No hay reservas confirmadas para probar');
    return;
  }

  console.log(`📋 Usando reserva: #${booking.booking_number}`);

  const transaction = {
    externalId: `booking_2025_${booking.id}`,
    type: 'INGRESO',
    date: new Date().toISOString(),
    amount: 75.50,
    ivaRate: 21,
    description: `Alquiler - Reserva #${booking.booking_number}`,
    documentType: 'NO APLICA',
    clientName: booking.customer?.name || 'Cliente',
    metadata: {
      bookingId: booking.id,
      customerId: booking.customer_id,
      source: 'ALQUILOSCOOTER',
      timestamp: new Date().toISOString()
    }
  };

  console.log('\n📤 Enviando transacción con datos reales...\n');

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ transactions: [transaction] })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ ÉXITO TOTAL!');
      console.log(`   - Procesadas: ${result.processed || 0}`);
      console.log(`   - Errores: ${result.errors || 0}`);
      if (result.results?.success?.length > 0) {
        console.log(`   - ID GSControl: ${result.results.success[0]}`);
      }
      console.log('\n🎉 LA INTEGRACIÓN FUNCIONA PERFECTAMENTE CON DATOS REALES!\n');
    } else {
      console.error('❌ Error:', result);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

testSyncToGSControl();
