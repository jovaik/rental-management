require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const prisma = new PrismaClient();

// Configuración de S3
function createS3Client() {
  return new S3Client({});
}

function getBucketConfig() {
  return {
    bucketName: process.env.AWS_BUCKET_NAME,
    folderPrefix: process.env.AWS_FOLDER_PREFIX || ''
  };
}

async function uploadFile(buffer, key) {
  const s3 = createS3Client();
  const { bucketName } = getBucketConfig();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: 'application/pdf'
  });

  await s3.send(command);
  return key;
}

async function regeneratePDF() {
  const puppeteer = require('puppeteer');
  
  try {
    const contractId = 72;
    
    console.log(`🔄 Regenerando PDF para contrato ID ${contractId}...`);
    
    // Obtener el contrato
    const contract = await prisma.carRentalContracts.findUnique({
      where: { id: contractId }
    });
    
    if (!contract) {
      console.error('❌ Contrato no encontrado');
      return;
    }
    
    if (!contract.contract_text) {
      console.error('❌ El contrato no tiene HTML');
      return;
    }
    
    console.log(`📄 Generando PDF (HTML: ${Math.round(contract.contract_text.length / 1024)}KB)...`);
    
    // Lanzar Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(contract.contract_text, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm',
      }
    });
    
    await browser.close();
    
    console.log(`✅ PDF generado (${Math.round(pdfBuffer.length / 1024)}KB)`);
    
    // Guardar localmente para descarga manual
    const outputPath = path.join(__dirname, `Contrato_${contract.contract_number}_Firmado.pdf`);
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`💾 PDF guardado localmente en: ${outputPath}`);
    
    // Subir a S3
    const { folderPrefix } = getBucketConfig();
    const fileName = `Contrato_${contract.contract_number}_Firmado.pdf`;
    const s3Key = `${folderPrefix}contratos/${fileName}`;
    
    console.log(`☁️  Subiendo a S3: ${s3Key}`);
    
    const s3Path = await uploadFile(Buffer.from(pdfBuffer), s3Key);
    
    // Actualizar en base de datos
    await prisma.carRentalContracts.update({
      where: { id: contractId },
      data: {
        pdf_cloud_storage_path: s3Path
      }
    });
    
    console.log(`✅ PDF guardado en S3: ${s3Path}`);
    console.log(`✅ Base de datos actualizada`);
    console.log(`\n🎉 ¡LISTO! El contrato ${contract.contract_number} ya se puede descargar desde la aplicación.`);
    console.log(`\nTambién puedes descargarlo manualmente desde: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

regeneratePDF();
