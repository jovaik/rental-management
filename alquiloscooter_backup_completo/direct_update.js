require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function directUpdate() {
  console.log('🔧 Actualización directa de pagos...\n');

  const payments = await prisma.bookingPayments.findMany({
    where: { gscontrol_id: null }
  });

  const year = new Date().getFullYear();

  for (const p of payments) {
    const externalId = `payment_${year}_${String(p.id).padStart(6, '0')}`;
    
    await prisma.bookingPayments.update({
      where: { id: p.id },
      data: { gscontrol_id: externalId }
    });

    console.log(`✅ Pago ${p.id} -> ${externalId}`);
  }

  console.log('\n✅ ACTUALIZACIÓN COMPLETADA');
  await prisma.$disconnect();
}

directUpdate().catch(err => {
  console.error('❌ ERROR:', err);
  prisma.$disconnect();
});
