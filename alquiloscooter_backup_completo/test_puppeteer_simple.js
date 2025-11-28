const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

async function testPuppeteer() {
  console.log('🧪 Testing Puppeteer + Chromium...\n');
  
  try {
    console.log('1. Getting Chromium executable path...');
    const execPath = await chromium.executablePath();
    console.log(`   ✅ Path: ${execPath}`);
    
    console.log('\n2. Launching browser...');
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
      executablePath: execPath,
      headless: true,
      timeout: 30000
    });
    
    console.log('   ✅ Browser launched successfully!');
    
    console.log('\n3. Creating new page...');
    const page = await browser.newPage();
    console.log('   ✅ Page created');
    
    console.log('\n4. Setting HTML content...');
    const html = '<html><body><h1 style="color: red;">TEST PDF</h1><p>Este es un PDF de prueba</p></body></html>';
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    console.log('   ✅ HTML set');
    
    console.log('\n5. Generating PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true
    });
    console.log(`   ✅ PDF generated: ${pdfBuffer.length} bytes`);
    
    await browser.close();
    console.log('\n✅ ALL TESTS PASSED!\n');
    
    return { success: true, size: pdfBuffer.length };
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nStack:', error.stack);
    return { success: false, error: error.message };
  }
}

testPuppeteer().then(result => {
  console.log('\nFinal result:', result);
  process.exit(result.success ? 0 : 1);
});
