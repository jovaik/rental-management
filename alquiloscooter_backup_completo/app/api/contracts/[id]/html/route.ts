
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

/**
 * GET /api/contracts/:id/html
 * Sirve el contrato completo con todas las condiciones, inspecciones y firma
 * ✅ SOLUCIÓN DEFINITIVA: Usa el contract_text completo de la DB + estilos de impresión
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

    // Obtener el contrato completo con el HTML generado
    const contract = await prisma.carRentalContracts.findUnique({
      where: { id: contractId },
      include: {
        booking: {
          include: {
            customer: true
          }
        }
      }
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    // Obtener el HTML completo del contrato (con condiciones, inspecciones, etc.)
    let contractHTML = contract.contract_text || '';

    if (!contractHTML || contractHTML.length < 100) {
      return NextResponse.json({ 
        error: 'El contrato no tiene contenido. Debe generarse primero desde la firma.' 
      }, { status: 400 });
    }

    // ✅ SIEMPRE agregar la firma si existe, independientemente del HTML existente
    // Esto resuelve el problema de firmas que no aparecen
    if (contract.signature_data && contract.signed_at) {
      // Buscar si ya existe alguna sección de firma para evitar duplicados
      const hasSignatureAlready = 
        contractHTML.includes(contract.signature_data) || // Si la imagen de firma ya está
        contractHTML.includes('<!-- FIRMA_DIGITAL_INSERTADA -->'); // Marcador
      
      if (!hasSignatureAlready) {
        const signatureSection = `
      <!-- FIRMA_DIGITAL_INSERTADA -->
      <div style="margin-top: 40px; page-break-before: avoid; page-break-inside: avoid;">
        <h3 style="color: #FF6B35; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #FF6B35; padding-bottom: 8px;">
          ✍️ Firma Digital del Cliente
        </h3>
        <div style="border: 2px solid #ddd; border-radius: 8px; padding: 20px; text-align: center; background: #fafafa;">
          <p style="font-weight: bold; margin-bottom: 10px;">Firma del Cliente</p>
          <img src="${contract.signature_data}" alt="Firma" style="max-width: 300px; max-height: 150px; margin: 20px auto; display: block; border: 1px solid #ddd; padding: 10px; background: white;" />
          <div style="font-size: 14px; color: #666; margin-top: 15px;">
            <div><strong>Firmado el:</strong> ${format(contract.signed_at, "dd/MM/yyyy 'a las' HH:mm", { locale: es })}</div>
            ${contract.ip_address ? `<div><strong>IP:</strong> ${contract.ip_address}</div>` : ''}
            <div style="margin-top: 10px; font-style: italic;">
              ${contract.booking.customer?.first_name || ''} ${contract.booking.customer?.last_name || ''}
            </div>
          </div>
        </div>
      </div>
    `;
        
        // Agregar antes de </body> o al final si no hay </body>
        if (contractHTML.includes('</body>')) {
          contractHTML = contractHTML.replace('</body>', `${signatureSection}</body>`);
        } else {
          contractHTML += signatureSection;
        }
      }
    }

    // ✅ AGREGAR ENLACE DE INSPECCIÓN si no existe en el HTML
    const hasInspectionLink = 
      contractHTML.includes('FOTOGRAFÍAS DE INSPECCIÓN') ||
      contractHTML.includes('/inspeccion/');
    
    if (!hasInspectionLink) {
      // Buscar enlace de inspección existente
      const inspectionLink = await prisma.inspectionLink.findFirst({
        where: {
          booking_id: contract.booking_id,
          expires_at: { gte: new Date() }
        }
      });

      if (inspectionLink) {
        const baseUrl = process.env.NEXTAUTH_URL || 'https://app.alquiloscooter.com';
        const fullLink = `${baseUrl}/inspeccion/${inspectionLink.token}`;
        
        const inspectionSection = `
          <div style="margin-top: 40px; padding: 32px; background: linear-gradient(135deg, #fff5f0 0%, #ffffff 100%); border: 3px solid #FF6B35; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); page-break-inside: avoid;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="font-size: 40px; margin-bottom: 12px;">📸</div>
              <div style="font-size: 18px; font-weight: 700; color: #FF6B35; margin-bottom: 8px;">
                FOTOGRAFÍAS DE INSPECCIÓN
              </div>
              <div style="width: 80px; height: 3px; background-color: #FF6B35; margin: 0 auto;"></div>
            </div>
            
            <p style="text-align: center; font-size: 14px; color: #555; margin-bottom: 20px;">
              🔗 Las fotografías de la inspección de su vehículo están disponibles en línea
            </p>
            
            <div style="background: linear-gradient(135deg, #FF6B35 0%, #ff8c5a 100%); padding: 24px; border-radius: 10px; box-shadow: 0 6px 16px rgba(255,107,53,0.3);">
              <p style="font-size: 12px; margin-bottom: 12px; color: white; font-weight: 600; text-transform: uppercase; text-align: center;">
                👇 ACCEDA AQUÍ 👇
              </p>
              <a href="${fullLink}" 
                 style="color: white; font-size: 14px; text-decoration: underline; font-weight: 700; word-break: break-all; display: block; text-align: center;">
                ${fullLink}
              </a>
            </div>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin-top: 16px;">
              <p style="font-size: 11px; color: #92400e; margin: 0; font-weight: 600;">
                ⏰ Enlace válido durante 30 días desde la fecha del contrato
              </p>
            </div>
          </div>
        `;
        
        // Agregar antes de la firma o antes del </body>
        if (contractHTML.includes('✍️ Firma') || contractHTML.includes('FIRMA DEL CONTRATO')) {
          contractHTML = contractHTML.replace(/(✍️\s*Firma|FIRMA DEL CONTRATO)/i, `${inspectionSection}\n\n$1`);
        } else {
          contractHTML = contractHTML.replace('</body>', `${inspectionSection}</body>`);
        }
      }
    }

    // Envolver el HTML del contrato con estilos de impresión y botón flotante
    const fullHTML = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Contrato ${contract.contract_number}</title>
      <style>
        /* Reseteo universal para consistencia */
        * {
          box-sizing: border-box;
        }
        
        /* Configuración de página para impresión */
        @page {
          size: A4;
          margin: 15mm; /* Márgenes estándar para A4 */
        }
        
        /* Estilos comunes (pantalla e impresión) */
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background: white;
        }
        
        @media print {
          /* Ocultar elementos no imprimibles */
          .no-print {
            display: none !important;
          }
          
          /* Asegurar que todo el contenido use el espacio disponible */
          html, body {
            width: 100% !important;
            height: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Forzar márgenes consistentes */
          body > *:not(.no-print) {
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
          
          /* Evitar saltos de página indeseados */
          h1, h2, h3, h4, h5, h6 {
            page-break-after: avoid;
          }
          
          table, figure, img {
            page-break-inside: avoid;
          }
        }
        
        /* Estilos para vista en pantalla */
        @media screen {
          body {
            padding: 20px;
            max-width: 210mm; /* Ancho A4 */
            margin: 0 auto;
          }
        }
        
        .print-button {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #FF6B35;
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
          z-index: 10000;
          transition: all 0.3s ease;
        }
        
        .print-button:hover {
          background: #E55A25;
          transform: scale(1.05);
        }
        
        .print-button:active {
          transform: scale(0.95);
        }
      </style>
    </head>
    <body>
      <button class="print-button no-print" onclick="window.print(); return false;">
        🖨️ Imprimir / Guardar PDF
      </button>
      
      ${contractHTML}
      
      <script>
        // Auto-abrir diálogo de impresión después de cargar (opcional, descomentarsi se desea)
        // window.onload = function() {
        //   setTimeout(() => window.print(), 500);
        // };
      </script>
    </body>
    </html>
    `;

    return new NextResponse(fullHTML, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline'
      }
    });

  } catch (error: any) {
    console.error('❌ [Contrato HTML] Error:', error);
    return NextResponse.json(
      { error: 'Error generando HTML del contrato', details: error.message },
      { status: 500 }
    );
  }
}
