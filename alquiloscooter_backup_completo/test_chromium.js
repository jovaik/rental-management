const fs = require('fs');
const path = require('path');

// Cargar .env
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
});

async function testChromium() {
  try {
    console.log('🧪 ========== TEST DE CHROMIUM ==========\n');
    
    console.log('📦 Importando módulos...');
    const puppeteer = require('puppeteer-core');
    const chromium = require('@sparticuz/chromium');
    
    console.log('✅ Módulos importados correctamente\n');
    
    console.log('🔍 Obteniendo executable path...');
    const executablePath = await chromium.executablePath();
    console.log('✅ Executable path:', executablePath);
    console.log('');
    
    console.log('🚀 Lanzando navegador Chromium...');
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: executablePath,
      headless: true
    });
    
    console.log('✅ Navegador lanzado exitosamente\n');
    
    console.log('📄 Creando página de prueba...');
    const page = await browser.newPage();
    
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><title>Test PDF</title></head>
        <body>
          <h1>🧪 Test de Generación PDF</h1>
          <p>Si ves este PDF, Chromium está funcionando correctamente.</p>
          <p>Fecha: ${new Date().toLocaleString('es-ES')}</p>
        </body>
      </html>
    `, { waitUntil: 'domcontentloaded' });
    
    console.log('✅ Contenido HTML cargado\n');
    
    console.log('📄 Generando PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true
    });
    
    console.log(`✅ PDF generado: ${Math.round(pdfBuffer.length / 1024)}KB\n`);
    
    await browser.close();
    console.log('✅ Navegador cerrado\n');
    
    console.log('✅ ========== TEST EXITOSO ==========');
    console.log('✅ Chromium funciona correctamente');
    console.log('✅ La generación de PDF está operativa\n');
    
  } catch (error) {
    console.error('\n❌ ========== ERROR EN TEST ==========');
    console.error('❌ Tipo:', error.constructor.name);
    console.error('❌ Mensaje:', error.message);
    if (error.stack) {
      console.error('❌ Stack:', error.stack.split('\n').slice(0, 5).join('\n'));
    }
    console.error('❌ =====================================\n');
    process.exit(1);
  }
}

testChromium();
