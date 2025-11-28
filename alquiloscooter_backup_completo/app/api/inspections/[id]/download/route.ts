import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 90;

/**
 * GET /api/inspections/:id/download
 * ✅ SIMPLIFICADO: Usa la misma lógica que /api/contracts/[id]/download (que funciona al 100%)
 * - Genera HTML desde /api/inspections/html
 * - Convierte a PDF con Puppeteer
 * - Retorna el Buffer directamente
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const inspectionId = parseInt(params.id);
    if (isNaN(inspectionId)) {
      return NextResponse.json({ error: 'ID de inspección inválido' }, { status: 400 });
    }

    console.log(`📥 [Download Inspection] Iniciando descarga para inspección ${inspectionId}`);

    // Obtener la inspección con datos relacionados
    const inspection = await prisma.vehicleInspections.findUnique({
      where: { id: inspectionId },
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
        },
        vehicle: true
      }
    });

    if (!inspection) {
      console.error(`❌ [Download Inspection] Inspección ${inspectionId} no encontrada`);
      return NextResponse.json({ error: 'Inspección no encontrada' }, { status: 404 });
    }

    console.log(`✅ [Download Inspection] Inspección encontrada: ${inspection.booking.booking_number}`);

    // ✅ USAR EL MISMO HTML QUE FUNCIONA EN EL NAVEGADOR
    // Construir URL interna para obtener el HTML (usa bookingId y vehicleId)
    const bookingId = inspection.booking_id;
    const vehicleId = inspection.vehicle_id;
    const baseUrl = process.env.NEXTAUTH_URL || 'https://app.alquiloscooter.com';
    const htmlUrl = `${baseUrl}/api/inspections/html?bookingId=${bookingId}&vehicleId=${vehicleId}`;
    
    console.log(`📄 [Download Inspection] Obteniendo HTML desde: ${htmlUrl}`);
    
    // Obtener el HTML usando fetch interno
    const htmlResponse = await fetch(htmlUrl, {
      headers: {
        'Cookie': `next-auth.session-token=${session.user.email}` // Pasar autenticación
      }
    });
    
    if (!htmlResponse.ok) {
      throw new Error(`Error obteniendo HTML: ${htmlResponse.status}`);
    }
    
    const inspectionHTML = await htmlResponse.text();
    console.log(`✅ [Download Inspection] HTML obtenido (${Math.round(inspectionHTML.length / 1024)}KB)`);

    // ✅ GENERAR PDF CON PUPPETEER (igual que el contrato)
    console.log(`📄 [Download Inspection] Generando PDF con Puppeteer...`);
    
    const { launchBrowser } = await import('@/lib/puppeteer-launcher');
    const browser = await launchBrowser();
    
    let pdfBuffer: Buffer;
    try {
      const page = await browser.newPage();
      await page.setContent(inspectionHTML, { waitUntil: 'networkidle0', timeout: 60000 });
      
      const pdfBytes = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        }
      });
      
      pdfBuffer = Buffer.from(pdfBytes);
      console.log(`✅ [Download Inspection] PDF generado exitosamente (${Math.round(pdfBuffer.length / 1024)}KB)`);
    } finally {
      await browser.close();
    }

    // Preparar la respuesta (igual que el contrato)
    const inspectionType = inspection.inspection_type === 'delivery' ? 'entrega' : 'devolucion';
    const fileName = `inspeccion-${inspectionType}-${inspection.vehicle?.registration_number || 'vehicle'}-${inspection.booking.booking_number}.pdf`;
    
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    headers.set('Content-Length', pdfBuffer.length.toString());

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers,
    });

  } catch (error: any) {
    console.error('❌ [Download Inspection] Error generando PDF:', error);
    
    let errorMessage = 'Error generando PDF de inspección';
    let statusCode = 500;
    
    if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
      errorMessage = 'Timeout generando PDF. Intente de nuevo.';
      statusCode = 504;
    } else if (error.message?.includes('Protocol error')) {
      errorMessage = 'Error de Chromium. Intente de nuevo en unos segundos.';
      statusCode = 503;
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: statusCode }
    );
  }
}
