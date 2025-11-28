require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const fs = require('fs');

const prisma = new PrismaClient();

async function testDownloadContract57() {
  try {
    console.log('🔍 Buscando contrato #57...\n');
    
    const contract = await prisma.carRentalContracts.findUnique({
      where: { id: 57 },
      include: {
        booking: {
          include: {
            customer: true,
            vehicles: {
              include: {
                car: true
              }
            }
          }
        }
      }
    });

    if (!contract) {
      console.log('❌ Contrato #57 no encontrado');
      return;
    }

    console.log('✅ Contrato encontrado:');
    console.log(`  ID: ${contract.id}`);
    console.log(`  Número: ${contract.contract_number}`);
    console.log(`  Reserva: ${contract.booking_id} (${contract.booking?.booking_number})`);
    console.log(`  Versión: ${contract.version}`);
    console.log(`  Firmado: ${contract.signed_at ? 'SÍ' : 'NO'}`);
    console.log(`  Tamaño HTML: ${Math.round(contract.contract_text.length / 1024)}KB`);
    console.log('');

    console.log('📄 Intentando generar PDF con Puppeteer + Chromium...\n');

    const browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--single-process',
        '--no-zygote'
      ],
      executablePath: await chromium.executablePath(),
      headless: true
    });

    try {
      const page = await browser.newPage();
      page.setDefaultTimeout(30000);
      
      console.log('📝 Cargando HTML...');
      await page.setContent(contract.contract_text, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      console.log('🖨️ Generando PDF...');
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '15mm',
          right: '15mm',
          bottom: '15mm',
          left: '15mm',
        },
        displayHeaderFooter: false,
      });
      
      console.log(`✅ PDF generado exitosamente: ${Math.round(pdfBuffer.length / 1024)}KB`);
      
      // Guardar el PDF para revisión
      const outputPath = '/home/ubuntu/rental_management_app/contrato_57_test.pdf';
      fs.writeFileSync(outputPath, pdfBuffer);
      console.log(`\n💾 PDF guardado en: ${outputPath}`);
      console.log('\n✅ TEST EXITOSO: El contrato se puede generar correctamente');

    } finally {
      await browser.close();
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testDownloadContract57();
