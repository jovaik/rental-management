import { prisma } from './lib/db';

async function verifyContract() {
  const contract = await prisma.carRentalContracts.findUnique({
    where: { booking_id: 126 }
  });

  if (!contract) {
    console.log('❌ No hay contrato');
    return;
  }

  const html = contract.contract_text || '';
  const hasPhotos = html.includes('data:image/jpeg;base64,');
  const photoMatches = html.match(/data:image\/jpeg;base64,/g);
  
  console.log(`\n✅ Contrato ID: ${contract.id}`);
  console.log(`📄 Longitud HTML: ${html.length} chars`);
  console.log(`📸 Contiene fotos: ${hasPhotos ? 'SÍ' : 'NO'}`);
  if (hasPhotos) {
    console.log(`📷 Cantidad de fotos: ${photoMatches?.length || 0}`);
  }
  
  // Buscar la sección de inspecciones
  const inspectionIndex = html.indexOf('inspection-comparison-section');
  if (inspectionIndex !== -1) {
    console.log(`\n✅ Sección de inspecciones ENCONTRADA en posición ${inspectionIndex}`);
    
    // Contar fotos después de la sección de inspecciones
    const inspectionHTML = html.substring(inspectionIndex);
    const inspectionPhotos = inspectionHTML.match(/data:image\/jpeg;base64,/g);
    console.log(`📷 Fotos en sección de inspecciones: ${inspectionPhotos?.length || 0}`);
  } else {
    console.log(`\n❌ Sección de inspecciones NO ENCONTRADA`);
  }
}

verifyContract()
  .catch(console.error)
  .finally(() => process.exit(0));
