require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkContract() {
  const contract = await prisma.carRentalContracts.findUnique({
    where: { booking_id: 124 },
    select: { contract_text: true }
  });
  
  if (contract && contract.contract_text) {
    const html = contract.contract_text;
    
    // Check for specific sections
    const hasFotografias = html.includes('FOTOGRAFÍAS DEL VEHÍCULO');
    const hasComparativa = html.includes('COMPARATIVA VISUAL');
    const hasInspeccionSalida = html.includes('Inspección de Salida');
    const hasInspeccionDevolucion = html.includes('Inspección de Devolución');
    
    console.log('Análisis del contrato 124:');
    console.log(`Tiene "FOTOGRAFÍAS DEL VEHÍCULO": ${hasFotografias}`);
    console.log(`Tiene "COMPARATIVA VISUAL": ${hasComparativa}`);
    console.log(`Tiene "Inspección de Salida": ${hasInspeccionSalida}`);
    console.log(`Tiene "Inspección de Devolución": ${hasInspeccionDevolucion}`);
    
    // Extract a snippet showing the inspection section structure
    const comparativaIndex = html.indexOf('COMPARATIVA');
    if (comparativaIndex !== -1) {
      const snippet = html.substring(comparativaIndex, comparativaIndex + 500);
      console.log('\nSnippet de la sección de inspecciones:');
      console.log(snippet.replace(/<[^>]*>/g, ' ').substring(0, 300));
    }
    
    const fotografiasIndex = html.indexOf('FOTOGRAF');
    if (fotografiasIndex !== -1) {
      const snippet = html.substring(fotografiasIndex, fotografiasIndex + 300);
      console.log('\nSnippet de la sección de fotografías:');
      console.log(snippet.replace(/<[^>]*>/g, ' ').substring(0, 200));
    }
  }
  
  await prisma.$disconnect();
}

checkContract().catch(console.error);
