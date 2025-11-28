import { NextRequest, NextResponse } from 'next/server';
import { generateContractHTML } from '@/lib/contracts/template';
// import { launchBrowser } from '@/lib/puppeteer-launcher'; // DISABLED - file not used

export const dynamic = 'force-dynamic';
export const maxDuration = 90;

/**
 * Endpoint de prueba para generar un PDF con firma digital
 * GET /api/test-contract-with-signature
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [TEST] Iniciando prueba de contrato con firma...');
    
    // Datos de prueba con firma digital (Base64 de una firma simple)
    const testSignatureBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAABkCAYAAAA8AQ3AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAARSSURBVHhe7doxAQAgEMCwq3+hERfqAgICXmM3wCVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBQVhQUFYUBAWFIQFBWFBQVhQEBYUhAUFYUFBWFAQFhSEBYPNzB8xwBDBOmPGCgAAAABJRU5ErkJggg==';
    
    const contractData = {
      contractNumber: 'TEST-001',
      contractDate: new Date().toLocaleDateString('es-ES'),
      customerFullname: 'Cliente de Prueba',
      customerDni: '12345678A',
      customerPhone: '+34600000000',
      customerEmail: 'test@example.com',
      customerAddress: 'Calle Test, 123',
      driverLicense: 'B-12345678',
      
      vehicles: [{
        registration: 'TEST-1234',
        make: 'Test',
        model: 'Vehicle',
        pricePerDay: 50,
        days: 3,
        total: 150
      }],
      
      pickupDate: new Date().toLocaleDateString('es-ES'),
      returnDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES'),
      
      subtotal: 150,
      iva: 31.5,
      totalPrice: '181.50',
      
      // ✅ FIRMA DIGITAL DE PRUEBA
      signatureData: testSignatureBase64,
      signatureDate: new Date().toLocaleDateString('es-ES'),
      signatureTime: new Date().toLocaleTimeString('es-ES'),
      ipAddress: '127.0.0.1'
    };
    
    console.log('📝 [TEST] Generando HTML del contrato...');
    const contractHTML = generateContractHTML(contractData);
    console.log(`✅ [TEST] HTML generado (${Math.round(contractHTML.length / 1024)}KB)`);
    
    // ✅ USAR EL NUEVO MÉTODO MEJORADO
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.launch(); // DISABLED file - using direct launch
    
    try {
      const page = await browser.newPage();
      page.setDefaultTimeout(90000);
      
      console.log(`📄 [TEST] Cargando HTML en la página...`);
      
      // ✅ MÉTODO MEJORADO: setContent con wait completo
      await page.setContent(contractHTML, { 
        waitUntil: 'load', // Esperar a que se cargue completamente
        timeout: 90000
      });
      
      console.log(`⏳ [TEST] Esperando a que se carguen todas las imágenes...`);
      
      // Esperar a que todas las imágenes (incluidas las Base64) estén completamente cargadas
      await page.evaluate(() => {
        return Promise.all(
          Array.from(document.images)
            .filter(img => !img.complete)
            .map(img => new Promise(resolve => {
              img.onload = img.onerror = resolve;
            }))
        );
      });
      
      console.log(`⏳ [TEST] Esperando 3s adicionales para asegurar renderizado...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log(`📄 [TEST] Generando PDF...`);
      
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
      
      console.log(`✅ [TEST] PDF generado (${Math.round(pdfBuffer.length / 1024)}KB)`)
      
      // Preparar la respuesta
      const headers = new Headers();
      headers.set('Content-Type', 'application/pdf');
      headers.set('Content-Disposition', `attachment; filename="test-contract-with-signature.pdf"`);
      headers.set('Content-Length', pdfBuffer.length.toString());
      
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers,
      });
      
    } finally {
      await browser.close();
    }
    
  } catch (error: any) {
    console.error('❌ [TEST] Error:', error);
    return NextResponse.json(
      { 
        error: 'Error en prueba de contrato',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
