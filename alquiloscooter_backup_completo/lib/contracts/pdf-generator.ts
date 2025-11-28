
import { uploadFile } from '@/lib/s3';

/**
 * RESTAURADO: Generador de PDF con html-pdf-node (funcionaba el 07/11/2025)
 * @param contractHTML - El HTML completo del contrato
 * @param contractNumber - Número del contrato para el nombre del archivo
 * @returns La ruta del PDF en S3 (cloud_storage_path)
 */
export async function generateAndUploadContractPDF(
  contractHTML: string,
  contractNumber: string
): Promise<string> {
  console.log(`📄 [PDF Generator] Iniciando generación de PDF para contrato ${contractNumber}...`);
  
  try {
    console.log(`📄 [PDF Generator] Cargando HTML (${Math.round(contractHTML.length / 1024)}KB)...`);
    
    // ✅ Usar html-pdf-node que SÍ funcionaba antes
    const htmlPdf = require('html-pdf-node');
    
    const options = { 
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm',
      }
    };
    
    const file = { content: contractHTML };

    console.log(`📄 [PDF Generator] Generando PDF con html-pdf-node...`);

    // Generar el PDF
    const pdfBuffer = await htmlPdf.generatePdf(file, options);
    
    console.log(`✅ [PDF Generator] PDF generado exitosamente (${Math.round(pdfBuffer.length / 1024)}KB)`);

    // Subir a S3
    const s3Key = `contracts/contrato-${contractNumber}.pdf`;
    console.log(`📁 [PDF Generator] Subiendo PDF a S3: ${s3Key}...`);
    
    const uploadResult = await uploadFile(Buffer.from(pdfBuffer), s3Key);
    
    console.log(`✅ [PDF Generator] PDF subido exitosamente a S3: ${uploadResult}`);
    
    return uploadResult; // Retorna el cloud_storage_path
    
  } catch (error: any) {
    console.error('❌ [PDF Generator] Error generando PDF:', error);
    console.error('❌ [PDF Generator] Stack:', error.stack);
    
    // Re-lanzar el error con más contexto
    throw new Error(`Error generando PDF: ${error.message}`);
  }
}
