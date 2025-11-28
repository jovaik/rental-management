require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { format } = require('date-fns');
const { es } = require('date-fns/locale');

const prisma = new PrismaClient();

async function test() {
  const contract = await prisma.carRentalContracts.findUnique({
    where: { id: 64 },
    include: {
      booking: {
        include: {
          customer: true
        }
      }
    }
  });

  if (!contract) {
    console.log('Contrato no encontrado');
    return;
  }

  let contractHTML = contract.contract_text || '';
  
  console.log(`📄 Contract HTML length: ${contractHTML.length}`);
  console.log(`✍️  Firmas en contract_text: ${(contractHTML.match(/Firma Digital del Cliente/g) || []).length}`);

  // Simular lo que hace el endpoint
  const signatureSection = contract.signature_data && contract.signed_at ? `
    <div style="margin-top: 40px;">
      <h3>✍️ Firma Digital del Cliente</h3>
    </div>
  ` : '';

  console.log(`\n🔍 Verificación antes de agregar firma:`);
  console.log(`   contract.signature_data existe: ${!!contract.signature_data}`);
  console.log(`   contract.signed_at existe: ${!!contract.signed_at}`);
  console.log(`   signatureSection generado: ${!!signatureSection}`);
  console.log(`   contractHTML.includes('Firma Digital del Cliente'): ${contractHTML.includes('Firma Digital del Cliente')}`);

  if (signatureSection && !contractHTML.includes('Firma Digital del Cliente')) {
    console.log(`\n✅ SE AGREGARÁ la firma (no está presente)`);
    contractHTML = contractHTML.replace('</body>', `${signatureSection}</body>`);
  } else {
    console.log(`\n⏭️  NO se agregará la firma`);
    if (!signatureSection) {
      console.log(`   Motivo: No hay signatureSection`);
    } else if (contractHTML.includes('Firma Digital del Cliente')) {
      console.log(`   Motivo: Ya está presente en el HTML`);
    }
  }

  console.log(`\n✍️  Firmas en HTML final: ${(contractHTML.match(/Firma Digital del Cliente/g) || []).length}`);

  // Verificar si el fullHTML final tendrá la firma envuelta dos veces
  const fullHTML = `
    <html><body>
      <button class="print-button">Imprimir</button>
      ${contractHTML}
    </body></html>
  `;

  console.log(`\n📋 Full HTML final:`);
  console.log(`   Longitud: ${fullHTML.length}`);
  console.log(`   Firmas totales: ${(fullHTML.match(/Firma Digital del Cliente/g) || []).length}`);

  await prisma.$disconnect();
}

test();
