import { prisma } from './lib/db';

async function testContractContent() {
  const contract = await prisma.carRentalContracts.findUnique({
    where: { booking_id: 126 }
  });

  if (!contract) {
    console.log('❌ No hay contrato para la reserva #126');
    return;
  }

  console.log('\n✅ Contrato encontrado:');
  console.log(`   ID: ${contract.id}`);
  console.log(`   Número: ${contract.contract_number}`);
  console.log(`   Firmado: ${contract.signed_at ? 'SÍ' : 'NO'}`);
  console.log(`\n📄 Longitud del HTML: ${contract.contract_text?.length || 0} chars`);
  
  // Verificar si contiene las palabras clave de inspecciones
  const html = contract.contract_text || '';
  const hasComparative = html.includes('COMPARATIVA VISUAL') || html.includes('inspectionComparison') || html.includes('inspection-comparison-section');
  const hasDeliveryHeader = html.includes('delivery-header') || html.includes('Inspección de Salida');
  const hasPhotos = html.includes('data:image/jpeg;base64,');
  
  console.log(`\n🔍 ANÁLISIS DEL CONTENIDO:`);
  console.log(`   - Sección comparativa: ${hasComparative ? '✅ SÍ' : '❌ NO'}`);
  console.log(`   - Header de inspección: ${hasDeliveryHeader ? '✅ SÍ' : '❌ NO'}`);
  console.log(`   - Fotos base64: ${hasPhotos ? '✅ SÍ' : '❌ NO'}`);
  
  if (hasPhotos) {
    const photoMatches = html.match(/data:image\/jpeg;base64,/g);
    console.log(`   - Cantidad de fotos: ${photoMatches?.length || 0}`);
  }
  
  // Mostrar un fragmento del HTML cerca de "inspección"
  const inspectionIndex = html.toLowerCase().indexOf('inspección');
  if (inspectionIndex !== -1) {
    console.log(`\n📋 Fragmento del HTML (cerca de "inspección"):`);
    console.log(html.substring(Math.max(0, inspectionIndex - 200), inspectionIndex + 400));
  }
}

testContractContent()
  .catch(console.error)
  .finally(() => process.exit(0));
