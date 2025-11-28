/**
 * ELIMINAR TODOS LOS DEPÓSITOS DE GSCONTROL
 * Los depósitos son fianzas que no deben sincronizarse
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const GSCONTROL_CONFIG = {
  apiKey: process.env.GSCONTROL_API_KEY || 'gs_69c6c837fac5c6ac12f40efcc44b55e9d2c97d61d3143933aa7390d14683d944',
  endpoint: process.env.GSCONTROL_ENDPOINT || 'https://gscontrol.abacusai.app/api/integrations/sync',
};

async function eliminarDepositos() {
  console.log('🗑️  ELIMINANDO DEPÓSITOS DE GSCONTROL\n');

  // Obtener todos los depósitos sincronizados
  const depositos = await prisma.bookingDeposits.findMany({
    where: {
      gscontrol_id: { not: null }
    },
    include: {
      booking: {
        include: {
          customer: true
        }
      }
    }
  });

  console.log(`📊 Depósitos a eliminar: ${depositos.length}\n`);

  if (depositos.length === 0) {
    console.log('✅ No hay depósitos sincronizados');
    await prisma.$disconnect();
    return;
  }

  // Mostrar depósitos a eliminar
  depositos.forEach(d => {
    const customerName = d.booking?.customer 
      ? `${d.booking.customer.first_name} ${d.booking.customer.last_name}`
      : 'Sin cliente';
    console.log(`  - ${d.gscontrol_id}: ${customerName} - €${d.monto_deposito}`);
  });

  console.log('\n🚀 Eliminando de GSControl...\n');

  // Extraer los IDs
  const idsToDelete = depositos.map(d => d.gscontrol_id).filter(Boolean);

  try {
    const response = await fetch(GSCONTROL_CONFIG.endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${GSCONTROL_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ externalIds: idsToDelete }),
    });

    const responseText = await response.text();
    console.log('📥 Respuesta GSControl:');
    console.log('Status:', response.status);
    console.log('Body:', responseText);
    console.log('');

    if (!response.ok) {
      console.error('❌ Error eliminando de GSControl');
      await prisma.$disconnect();
      process.exit(1);
    }

    const result = JSON.parse(responseText);
    console.log(`✅ Eliminados de GSControl: ${result.deleted || 0}`);

    // Actualizar base de datos
    console.log('\n💾 Actualizando base de datos...\n');
    
    await prisma.bookingDeposits.updateMany({
      where: {
        gscontrol_id: { in: idsToDelete }
      },
      data: {
        gscontrol_id: null
      }
    });

    console.log(`✅ ${depositos.length} depósitos limpiados en la base de datos`);

    console.log('\n' + '='.repeat(80));
    console.log('🎉 LIMPIEZA COMPLETADA');
    console.log('='.repeat(80));
    console.log(`\n📊 Resumen:`);
    console.log(`   - Eliminados de GSControl: ${result.deleted || 0}`);
    console.log(`   - Limpiados en DB: ${depositos.length}`);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  }

  await prisma.$disconnect();
}

eliminarDepositos().catch(err => {
  console.error('❌ ERROR:', err);
  prisma.$disconnect();
  process.exit(1);
});
