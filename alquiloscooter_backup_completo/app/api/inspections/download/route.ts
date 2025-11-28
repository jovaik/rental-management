
import { NextRequest, NextResponse } from 'next/server';
import { launchBrowser } from '@/lib/puppeteer-launcher';

export const dynamic = 'force-dynamic';

/**
 * GET /api/inspections/download
 * Genera y descarga PDF de inspección directamente (sin window.print())
 * Perfecto para móviles
 */
export async function GET(req: NextRequest) {
  let browser;
  
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('bookingId');
    const vehicleId = searchParams.get('vehicleId');

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId es requerido' },
        { status: 400 }
      );
    }

    console.log(`📥 [PDF Download] Generando PDF para booking ${bookingId}, vehicle ${vehicleId || 'all'}`);

    // Construir URL del HTML de inspección
    const htmlUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}/api/inspections/html?bookingId=${bookingId}${vehicleId ? `&vehicleId=${vehicleId}` : ''}`;

    console.log(`📄 [PDF Download] Renderizando HTML desde: ${htmlUrl}`);

    // Lanzar Puppeteer
    browser = await launchBrowser();
    const page = await browser.newPage();

    // Navegar a la página HTML
    await page.goto(htmlUrl, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log(`✅ [PDF Download] HTML cargado exitosamente`);

    // Generar PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    });

    console.log(`✅ [PDF Download] PDF generado (${(pdfBuffer.length / 1024).toFixed(2)} KB)`);

    await browser.close();

    // Generar nombre del archivo
    const fileName = `inspeccion-${bookingId}${vehicleId ? `-vehicle-${vehicleId}` : ''}.pdf`;

    // Retornar PDF como descarga
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });

  } catch (error: any) {
    console.error('❌ [PDF Download] Error:', error);
    
    if (browser) {
      await browser.close().catch(() => {});
    }

    return NextResponse.json(
      { error: 'Error generando PDF', details: error.message },
      { status: 500 }
    );
  }
}
