
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateContractHTML } from '@/lib/contracts/template';

export const dynamic = 'force-dynamic';
export const maxDuration = 90; // Máximo 90 segundos para funciones serverless (contratos con muchas fotos)

/**
 * GET /api/contracts/:id/download
 * Descarga el contrato en formato PDF
 * ✅ CRÍTICO: Regenera el HTML con la firma actualizada antes de generar el PDF
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

    const contractId = parseInt(params.id);
    if (isNaN(contractId)) {
      return NextResponse.json({ error: 'ID de contrato inválido' }, { status: 400 });
    }

    // Obtener el contrato con todos los datos necesarios
    const contract = await prisma.carRentalContracts.findUnique({
      where: { id: contractId },
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
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    console.log(`📄 [Contrato] Generando PDF con Chrome del sistema para ${contract.contract_number}...`);
    console.log(`🖊️ [Contrato] Firma en DB: ${contract.signature_data ? 'SÍ' : 'NO'}`);
    
    // ✅ SOLUCIÓN: Regenerar el HTML del contrato con la firma actualizada
    let contractHTML = contract.contract_text;
    
    if (contract.signature_data) {
      console.log(`🖊️ [Contrato] Regenerando HTML con firma actualizada...`);
      
      // Preparar datos para regenerar el contrato
      const contractData = {
        contractNumber: contract.contract_number,
        contractDate: contract.created_at ? new Date(contract.created_at).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES'),
        customerFullname: `${contract.booking.customer?.first_name || ''} ${contract.booking.customer?.last_name || ''}`.trim(),
        customerDni: contract.booking.customer?.dni_nie || 'N/A',
        customerPhone: contract.booking.customer?.phone || 'N/A',
        customerEmail: contract.booking.customer?.email || 'N/A',
        customerAddress: contract.booking.customer?.address || 'N/A',
        driverLicense: contract.booking.customer?.driver_license || 'N/A',
        
        vehicles: contract.booking.vehicles.map(bv => ({
          registration: bv.car.registration_number || 'N/A',
          make: bv.car.make || 'N/A',
          model: bv.car.model || 'N/A',
          pricePerDay: 0,
          days: 0,
          total: parseFloat(bv.vehicle_price?.toString() || '0')
        })),
        
        pickupDate: contract.booking.pickup_date ? new Date(contract.booking.pickup_date).toLocaleDateString('es-ES') : 'N/A',
        returnDate: contract.booking.return_date ? new Date(contract.booking.return_date).toLocaleDateString('es-ES') : 'N/A',
        
        subtotal: 0,
        iva: 0,
        totalPrice: contract.booking.total_price?.toString() || '0',
        
        // ✅ INCLUIR LA FIRMA
        signatureData: contract.signature_data,
        signatureDate: contract.signed_at ? new Date(contract.signed_at).toLocaleDateString('es-ES') : undefined,
        signatureTime: contract.signed_at ? new Date(contract.signed_at).toLocaleTimeString('es-ES') : undefined,
        ipAddress: contract.ip_address || undefined
      };
      
      contractHTML = generateContractHTML(contractData);
      console.log(`✅ [Contrato] HTML regenerado con firma (${Math.round(contractHTML.length / 1024)}KB)`);
    } else {
      console.log(`📄 [Contrato] Sin firma, usando HTML original`);
    }
    
    // ✅ DEFINITIVO: Usar puppeteer-core + @sparticuz/chromium para producción serverless
    console.log(`📄 [Contrato] Generando PDF con @sparticuz/chromium (${Math.round(contractHTML.length / 1024)}KB)...`);
    
    const { launchBrowser } = await import('@/lib/puppeteer-launcher');
    const browser = await launchBrowser();
    
    let pdfBuffer: Buffer;
    try {
      const page = await browser.newPage();
      await page.setContent(contractHTML, { waitUntil: 'domcontentloaded' });
      
      const pdfBytes = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15mm',
          right: '15mm',
          bottom: '15mm',
          left: '15mm',
        }
      });
      
      pdfBuffer = Buffer.from(pdfBytes);
      console.log(`✅ [Contrato] PDF generado exitosamente (${Math.round(pdfBuffer.length / 1024)}KB)`);
    } finally {
      await browser.close();
    }

    // Preparar la respuesta
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="contrato-${contract.contract_number}.pdf"`);
    headers.set('Content-Length', pdfBuffer.length.toString());

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers,
    });

  } catch (error: any) {
    console.error('❌ [Contrato] Error generando PDF del contrato:', error);
    
    // Identificar el tipo de error para dar mejor feedback
    let errorMessage = 'Error generando PDF del contrato';
    let statusCode = 500;
    
    if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
      errorMessage = 'Timeout generando PDF. El contrato tiene muchas fotos. Intente de nuevo o contacte soporte.';
      statusCode = 504;
    } else if (error.message?.includes('memory') || error.message?.includes('Memory')) {
      errorMessage = 'Error de memoria generando PDF. El contrato es muy grande.';
      statusCode = 507;
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