import { PrismaClient } from '@prisma/client';
import { generateAndUploadContractPDF } from '../lib/contracts/pdf-generator';

const prisma = new PrismaClient();

async function generateMissingPDFs() {
  try {
    console.log('🔍 Buscando contratos sin PDF...');
    
    // Buscar todos los contratos firmados sin PDF
    const contracts = await prisma.carRentalContracts.findMany({
      where: {
        signed_at: { not: null },
        pdf_cloud_storage_path: null
      },
      orderBy: { id: 'desc' },
      take: 10 // Procesar máximo 10 a la vez para evitar timeouts
    });
    
    console.log(`📄 Encontrados ${contracts.length} contratos sin PDF`);
    
    for (const contract of contracts) {
      try {
        console.log(`\n📝 Procesando contrato ${contract.contract_number} (ID: ${contract.id})...`);
        
        const pdfPath = await generateAndUploadContractPDF(
          contract.contract_text,
          contract.contract_number
        );
        
        // Actualizar el contrato con la ruta del PDF
        await prisma.carRentalContracts.update({
          where: { id: contract.id },
          data: { pdf_cloud_storage_path: pdfPath }
        });
        
        console.log(`✅ PDF generado y guardado: ${pdfPath}`);
      } catch (error: any) {
        console.error(`❌ Error procesando contrato ${contract.id}:`, error.message);
      }
    }
    
    console.log('\n✅ Proceso completado');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateMissingPDFs();
