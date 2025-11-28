require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const contract = await prisma.carRentalContracts.findFirst({
    where: { booking_id: 130 },
    select: { id: true, contract_text: true }
  });

  if (!contract) {
    console.log('Contrato no encontrado');
    return;
  }

  const text = contract.contract_text || '';
  const signatureCount = (text.match(/Firma Digital del Cliente/g) || []).length;
  
  console.log(`✅ Contrato ID: ${contract.id}`);
  console.log(`📝 Longitud del HTML: ${text.length} caracteres`);
  console.log(`✍️  "Firma Digital del Cliente" aparece: ${signatureCount} veces`);
  
  if (text.includes('inspección') || text.includes('inspection')) {
    console.log(`🔗 Tiene referencias a inspección: SÍ`);
  } else {
    console.log(`🔗 Tiene referencias a inspección: NO`);
  }

  await prisma.$disconnect();
}

check();
