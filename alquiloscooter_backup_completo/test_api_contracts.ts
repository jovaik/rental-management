import { prisma } from './lib/db';

async function testAPI() {
  // Simular el GET de /api/contracts
  const bookingId = 126;
  
  console.log('\n🔍 PROBANDO API /api/contracts...\n');
  
  let contract = await prisma.carRentalContracts.findUnique({
    where: {
      booking_id: bookingId
    },
    include: {
      booking: {
        include: {
          car: true,
          customer: true
        }
      }
    }
  });

  if (!contract) {
    console.log('❌ No hay contrato');
    return;
  }

  console.log(`✅ Contrato encontrado - ID: ${contract.id}`);
  console.log(`📄 Longitud contract_text: ${contract.contract_text?.length || 0} chars`);
  
  const html = contract.contract_text || '';
  const hasPhotos = html.includes('data:image/jpeg;base64,');
  const photoMatches = html.match(/data:image\/jpeg;base64,/g);
  
  console.log(`📸 Contiene fotos: ${hasPhotos ? 'SÍ' : 'NO'}`);
  if (hasPhotos) {
    console.log(`📷 Cantidad de fotos: ${photoMatches?.length || 0}`);
  }
  
  // Verificar si tiene la sección de inspecciones
  const hasInspectionSection = html.includes('inspection-comparison-section');
  console.log(`📋 Tiene sección de inspecciones: ${hasInspectionSection ? 'SÍ' : 'NO'}`);
  
  // Simular JSON.stringify para ver si se trunca
  const jsonString = JSON.stringify(contract);
  console.log(`\n📦 Longitud del JSON completo: ${jsonString.length} chars`);
  console.log(`📊 Tamaño en MB: ${(jsonString.length / 1024 / 1024).toFixed(2)} MB`);
}

testAPI()
  .catch(console.error)
  .finally(() => process.exit(0));
