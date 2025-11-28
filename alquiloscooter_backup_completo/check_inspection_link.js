require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const link = await prisma.inspectionLink.findFirst({
    where: { booking_id: 130 }
  });

  if (link) {
    console.log(`✅ Enlace de inspección encontrado:`);
    console.log(`   Token: ${link.token}`);
    console.log(`   Expira: ${link.expires_at}`);
    console.log(`   URL: https://app.alquiloscooter.com/inspeccion/${link.token}`);
  } else {
    console.log(`❌ No hay enlace de inspección para la reserva 130`);
  }

  await prisma.$disconnect();
}

check();
