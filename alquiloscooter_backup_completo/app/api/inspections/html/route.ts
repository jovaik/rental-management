
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Cachear el logo en Base64 para evitar leerlo en cada request
let cachedLogoBase64: string | null = null;

function getLogoBase64(): string {
  if (cachedLogoBase64) {
    return cachedLogoBase64;
  }
  
  try {
    const logoPath = path.join(process.cwd(), 'public', 'alquiloscooter-logo.png');
    const logoBuffer = fs.readFileSync(logoPath);
    cachedLogoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    return cachedLogoBase64;
  } catch (error) {
    console.error('❌ Error cargando logo:', error);
    return ''; // Retornar string vacío si falla
  }
}

/**
 * Convierte una ruta de S3 a una URL del proxy interno que nunca expira
 */
const convertToProxyUrl = (s3Path: string | null): string | null => {
  if (!s3Path) return null;
  // Remover el prefijo del bucket si existe
  const cleanPath = s3Path.replace(/^rental-app-storage\//, '');
  // Convertir a URL absoluta del proxy
  return `/api/s3/image/${cleanPath}`;
};

/**
 * GET /api/inspections/html
 * Genera HTML de inspección para imprimir como PDF desde el navegador
 * ✅ SOLUCIÓN DEFINITIVA: URLs de proxy permanentes + estilos de impresión
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('bookingId');
    const vehicleIdParam = searchParams.get('vehicleId');

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId requerido' }, { status: 400 });
    }

    // Obtener reserva con vehículos y firmas
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id: parseInt(bookingId) },
      include: {
        vehicles: {
          include: {
            car: true
          }
        }
      }
    });
    
    // Convertir firmas a URLs del proxy si existen
    const customerSignatureUrl = booking?.customer_signature_path 
      ? convertToProxyUrl(booking.customer_signature_path) 
      : null;
    const staffSignatureUrl = booking?.staff_signature_path 
      ? convertToProxyUrl(booking.staff_signature_path) 
      : null;

    if (!booking || !booking.vehicles || booking.vehicles.length === 0) {
      return NextResponse.json({ error: 'Reserva o vehículo no encontrado' }, { status: 404 });
    }

    // ✅ OBTENER TODOS LOS VEHÍCULOS Y SUS INSPECCIONES
    const vehiclesWithInspections = await Promise.all(
      booking.vehicles.map(async (bv) => {
        const vehicle = bv.car;
        
        // Obtener inspección de entrega
        const deliveryInspection = await prisma.vehicleInspections.findFirst({
          where: {
            booking_id: booking.id,
            vehicle_id: vehicle.id,
            inspection_type: 'delivery'
          },
          include: {
            inspector: true
          }
        });

        // Obtener inspección de devolución
        const returnInspection = await prisma.vehicleInspections.findFirst({
          where: {
            booking_id: booking.id,
            vehicle_id: vehicle.id,
            inspection_type: 'return'
          },
          include: {
            inspector: true
          }
        });

        return {
          vehicle,
          deliveryInspection,
          returnInspection
        };
      })
    );

    console.log(`📋 Generando HTML de inspección para ${vehiclesWithInspections.length} vehículo(s)`);

    // Función para generar sección de perspectiva (una foto de cada inspección lado a lado)
    const generatePerspectiveSection = (
      perspectiveName: string, 
      deliveryInspection: any, 
      returnInspection: any,
      photoField: string,
      showSignatures: boolean = false // TRUE solo para la primera perspectiva
    ) => {
      const deliveryUrl = deliveryInspection ? convertToProxyUrl((deliveryInspection as any)[photoField]) : null;
      const returnUrl = returnInspection ? convertToProxyUrl((returnInspection as any)[photoField]) : null;

      // Sin metadata aquí - se muestra solo una vez al inicio
      
      // Firmas (solo mostrar en la primera sección de perspectiva)
      const signaturesHtml = showSignatures ? `
        <div class="signatures-section">
          ${customerSignatureUrl ? `
            <div class="signature-box">
              <div class="signature-label">Firma del Cliente</div>
              <img src="${customerSignatureUrl}" alt="Firma del Cliente" class="signature-image" />
            </div>
          ` : ''}
          ${staffSignatureUrl ? `
            <div class="signature-box">
              <div class="signature-label">Firma del Personal</div>
              <img src="${staffSignatureUrl}" alt="Firma del Personal" class="signature-image" />
            </div>
          ` : ''}
        </div>
      ` : '';

      return `
        <div class="perspective-section">
          <div class="perspective-header">${perspectiveName}</div>
          <div class="perspective-comparison">
            <div class="photo-column delivery">
              ${deliveryUrl 
                ? `<img src="${deliveryUrl}" alt="${perspectiveName} - Salida" class="large-photo" onerror="this.parentElement.innerHTML='<div class=no-photo>⚠️ Imagen no disponible</div>';" />`
                : '<div class="no-photo">Sin foto de salida</div>'
              }
              ${signaturesHtml}
            </div>
            <div class="photo-column return">
              ${returnUrl 
                ? `<img src="${returnUrl}" alt="${perspectiveName} - Regreso" class="large-photo" onerror="this.parentElement.innerHTML='<div class=no-photo>⚠️ Imagen no disponible</div>';" />`
                : '<div class="no-photo">Sin foto de regreso</div>'
              }
              ${signaturesHtml}
            </div>
          </div>
        </div>
      `;
    };

    // Generar HTML
    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Inspección ${booking.booking_number}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        /* Configuración de página para impresión HORIZONTAL (Landscape) - Prioridad: Visión clara */
        @page {
          size: A4 landscape;
          margin: 10mm 12mm;  /* Márgenes generosos para mejor visualización */
        }
        
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.5;
          color: #333;
          background: white;
        }
        
        @media print {
          /* Eliminar encabezados y pies de página del navegador */
          html, body {
            width: 100% !important;
            height: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
          
          /* Ocultar elementos no imprimibles */
          .no-print {
            display: none !important;
          }
          
          /* ✅ PRIORIDAD: VISIÓN CLARA - Fotos grandes y legibles */
          body {
            padding: 0 !important;
            margin: 0 !important;
          }
          
          .header {
            margin-bottom: 8px !important;
            padding-bottom: 6px !important;
            border-bottom: 2px solid #FF6B35 !important;
          }
          
          .logo-image {
            max-height: 40px !important;
          }
          
          .document-badge {
            padding: 6px 12px !important;
            min-width: 140px !important;
          }
          
          .document-label {
            font-size: 10px !important;
            margin-bottom: 3px !important;
          }
          
          .document-number {
            font-size: 13px !important;
            font-weight: bold !important;
          }
          
          .vehicle-info {
            padding: 8px 12px !important;
            margin-bottom: 8px !important;
            gap: 8px !important;
            border: 2px solid #e0e0e0 !important;
          }
          
          .vehicle-info div {
            font-size: 12px !important;
          }
          
          /* Metadata legible y espaciada */
          .inspection-metadata-container {
            margin: 8px 0 !important;
            gap: 8px !important;
          }
          
          .metadata-column {
            padding: 8px !important;
            font-size: 9px !important;
            line-height: 1.4 !important;
          }
          
          .metadata-column-title {
            font-size: 11px !important;
            padding: 6px !important;
            margin-bottom: 6px !important;
            font-weight: bold !important;
          }
          
          .metadata-column div {
            margin-bottom: 3px !important;
          }
          
          /* Secciones de perspectiva con espacio natural */
          .perspective-section {
            margin-bottom: 12px !important;
            page-break-inside: avoid;  /* Evitar cortar fotos grandes */
          }
          
          .perspective-header {
            padding: 8px 12px !important;
            font-size: 13px !important;
            font-weight: bold !important;
          }
          
          .photo-column {
            padding: 10px !important;
          }
          
          /* ✅ FOTOS MAXIMIZADAS: 480px altura - Uso máximo del espacio landscape */
          .large-photo {
            max-width: 95% !important;
            width: auto !important;
            max-height: 480px !important;  /* 50% más grande para máxima claridad */
            border: 2px solid !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
            margin: 10px auto !important;
            display: block !important;
          }
          
          .no-photo {
            max-width: 95% !important;
            height: 280px !important;
            font-size: 14px !important;
            margin: 10px auto !important;
          }
          
          /* Firmas visibles y legibles */
          .signatures-section {
            margin-top: 12px !important;
            padding: 8px !important;
            gap: 8px !important;
          }
          
          .signature-image {
            max-width: 140px !important;
            max-height: 60px !important;
          }
          
          .signature-label {
            font-size: 10px !important;
            margin-bottom: 4px !important;
            font-weight: bold !important;
          }
          
          .footer {
            margin-top: 12px !important;
            padding-top: 8px !important;
            font-size: 9px !important;
          }
          
          /* Permitir saltos de página inteligentes para mejor distribución */
          .perspective-section {
            page-break-inside: auto;  /* Permite saltos si es necesario */
          }
          
          .inspection-metadata-container {
            page-break-inside: avoid;  /* Evitar cortar metadata */
            page-break-after: avoid;   /* Mantener metadata con fotos */
          }
          
          .perspective-header {
            page-break-after: avoid !important;  /* No separar título de contenido */
          }
          
          .perspective-comparison {
            page-break-inside: auto;  /* Permite saltos entre columnas si es necesario */
          }
          
          /* CRÍTICO: Forzar impresión de todos los colores y fondos */
          * {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          /* Barras de perspectiva en NARANJA */
          .perspective-header {
            background: linear-gradient(135deg, #DF7311, #FF8C42) !important;
            color: white !important;
          }
          
          /* Columna SALIDA (IZQUIERDA) - VERDE */
          .photo-column.delivery {
            background: #E8F8F5 !important;
            border-right: 1px solid #2E8688 !important;
          }
          
          .photo-column.delivery .photo-column-title {
            background: #2E8688 !important;
            color: white !important;
          }
          
          .photo-column.delivery .large-photo {
            border-color: #2E8688 !important;
          }
          
          .photo-column.delivery .inspection-metadata {
            background: rgba(46, 134, 136, 0.1) !important;
            border-left: 3px solid #2E8688 !important;
          }
          
          /* Columna REGRESO (DERECHA) - ROJO */
          .photo-column.return {
            background: #FFF5F5 !important;
          }
          
          .photo-column.return .photo-column-title {
            background: #D2011F !important;
            color: white !important;
          }
          
          .photo-column.return .large-photo {
            border-color: #D2011F !important;
          }
          
          .photo-column.return .inspection-metadata {
            background: rgba(210, 1, 31, 0.1) !important;
            border-left: 3px solid #D2011F !important;
          }
        }
        
        /* Estilos para vista en pantalla */
        @media screen {
          body {
            padding: 20px;
          }
        }
        
        /* HEADER - Idéntico al contrato */
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 25px; 
          padding-bottom: 15px; 
          border-bottom: 2px solid #FF6B35; 
        }
        .logo-section { flex: 1; }
        .logo-image { 
          max-width: 300px; 
          max-height: 70px; 
          width: auto; 
          height: auto; 
          object-fit: contain; 
        }
        .document-badge { 
          background: linear-gradient(135deg, #DF7311, #FF8C42); 
          color: white; 
          padding: 12px 20px; 
          border-radius: 6px; 
          text-align: center; 
          min-width: 180px;
        }
        .document-label {
          font-size: 11px;
          font-weight: normal;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }
        .document-number { 
          font-size: 16px; 
          font-weight: bold; 
        }
        
        .vehicle-info {
          background: #f9f9f9;
          padding: 20px 25px;
          border-radius: 8px;
          margin-bottom: 25px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          border: 2px solid #e0e0e0;
        }
        
        .vehicle-info div {
          font-size: 20px;
          font-weight: 700;
          color: #2c3e50;
          font-family: 'Arial', 'Helvetica', sans-serif;
          letter-spacing: 0.3px;
        }
        
        .vehicle-info strong {
          color: #34495e;
          font-weight: 900;
        }
        
        
        /* METADATA UNA SOLA VEZ AL INICIO */
        .inspection-metadata-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin: 20px 0;
        }
        
        .metadata-column {
          padding: 15px;
          border-radius: 8px;
          font-size: 11px;
          line-height: 1.8;
        }
        
        .metadata-column-title {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 10px;
          padding: 8px;
          border-radius: 4px;
          text-align: center;
          color: white;
        }
        
        .delivery-metadata {
          background: #E8F8F5;
          border: 2px solid #2E8688;
        }
        
        .delivery-metadata .metadata-column-title {
          background: #2E8688;
        }
        
        .return-metadata {
          background: #FFF5F5;
          border: 2px solid #D2011F;
        }
        
        .return-metadata .metadata-column-title {
          background: #D2011F;
        }
        
        .metadata-column div {
          margin-bottom: 5px;
        }
        
        .no-inspection {
          text-align: center;
          color: #999;
          padding: 20px;
          font-style: italic;
        }
        /* DISEÑO POR PERSPECTIVA - FOTOS GRANDES LADO A LADO */
        .perspectives-container {
          margin-top: 20px;
        }
        
        .perspective-section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        
        /* Barra de perspectiva en NARANJA */
        .perspective-header {
          background: linear-gradient(135deg, #DF7311, #FF8C42);
          color: white;
          padding: 12px 20px;
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          border-radius: 6px 6px 0 0;
          text-transform: uppercase;
        }
        
        .perspective-comparison {
          display: grid;
          grid-template-columns: 1fr 1fr;  /* Lado a lado: SALIDA | REGRESO */
          gap: 0;
          border: 2px solid #e0e0e0;
          border-top: none;
          border-radius: 0 0 6px 6px;
          overflow: hidden;
        }
        
        .photo-column {
          padding: 6px;
          text-align: center;
        }
        
        /* Columna SALIDA (IZQUIERDA) - VERDE */
        .photo-column.delivery {
          background: #E8F8F5;
          border-right: 2px solid #2E8688;
        }
        
        .photo-column.delivery .photo-column-title {
          background: #2E8688;
          color: white;
          padding: 8px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .photo-column.delivery .large-photo {
          border: 3px solid #2E8688;
        }
        
        .photo-column.delivery .inspection-metadata {
          background: rgba(46, 134, 136, 0.1);
          border-left: 4px solid #2E8688;
          padding: 10px;
          margin-bottom: 12px;
          text-align: left;
          font-size: 10px;
          line-height: 1.6;
        }
        
        /* Columna REGRESO (DERECHA) - ROJO */
        .photo-column.return {
          background: #FFF5F5;
        }
        
        .photo-column.return .photo-column-title {
          background: #D2011F;
          color: white;
          padding: 8px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .photo-column.return .large-photo {
          border: 3px solid #D2011F;
        }
        
        .photo-column.return .inspection-metadata {
          background: rgba(210, 1, 31, 0.1);
          border-left: 4px solid #D2011F;
          padding: 10px;
          margin-bottom: 12px;
          text-align: left;
          font-size: 10px;
          line-height: 1.6;
        }
        
        .inspection-metadata div {
          margin-bottom: 3px;
        }
        
        .large-photo {
          width: 100%;
          max-width: 400px;
          height: auto;
          border-radius: 8px;
          border: 3px solid;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .photo-column.delivery .large-photo {
          border-color: #2E8688;
        }
        
        .photo-column.return .large-photo {
          border-color: #DF7311;
        }
        
        .no-photo {
          width: 100%;
          max-width: 400px;
          height: 250px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f5;
          border: 2px dashed #ccc;
          border-radius: 8px;
          color: #999;
          font-size: 14px;
        }
        
        .button-container {
          position: fixed;
          top: 20px;
          right: 20px;
          display: flex;
          gap: 10px;
          z-index: 10000;
        }
        
        .download-button,
        .print-button {
          background: #FF6B35;
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
          transition: all 0.3s ease;
        }
        
        .download-button {
          background: #2E8688;
          box-shadow: 0 4px 12px rgba(46, 134, 136, 0.4);
        }
        
        .download-button:hover {
          background: #257375;
          transform: scale(1.05);
        }
        
        .print-button:hover {
          background: #E55A25;
          transform: scale(1.05);
        }
        
        .download-button:active,
        .print-button:active {
          transform: scale(0.95);
        }
        
        /* Responsive: En móviles, los botones se apilan verticalmente */
        @media (max-width: 768px) {
          .button-container {
            flex-direction: column;
            gap: 5px;
          }
          
          .download-button,
          .print-button {
            padding: 12px 20px;
            font-size: 14px;
          }
        }
        
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 2px solid #ddd;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        
        /* ESTILOS DE FIRMAS */
        .signatures-section {
          margin-top: 20px;
          padding: 15px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .signature-box {
          text-align: center;
        }
        
        .signature-label {
          font-size: 12px;
          font-weight: bold;
          color: #555;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .signature-image {
          max-width: 200px;
          max-height: 80px;
          width: auto;
          height: auto;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          padding: 5px;
        }
        
        @media print {
          .signatures-section {
            background: rgba(255, 255, 255, 0.9) !important;
          }
          
          .signature-image {
            border: 1px solid #ddd !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="button-container no-print">
        <button class="print-button" onclick="window.print(); return false;">
          🖨️ Imprimir / Guardar como PDF
        </button>
      </div>
      
      <div class="header">
        <div class="logo-section">
          <img src="${getLogoBase64()}" alt="Alquiloscooter" class="logo-image">
        </div>
        <div class="document-badge">
          <div class="document-label">CONTRATO</div>
          <div class="document-number">${booking.booking_number || 'N/A'}</div>
        </div>
      </div>
      
      ${vehiclesWithInspections.map((item, index) => `
        ${index > 0 ? '<div style="page-break-before: always; margin-top: 40px;"></div>' : ''}
        
        <div class="vehicle-info">
          <div><strong>MARCA:</strong> ${item.vehicle.make}</div>
          <div><strong>MODELO:</strong> ${item.vehicle.model}</div>
          <div><strong>MATRÍCULA:</strong> ${item.vehicle.registration_number}</div>
        </div>
        
        <!-- METADATA UNA SOLA VEZ -->
        <div class="inspection-metadata-container">
          <div class="metadata-column delivery-metadata">
            <div class="metadata-column-title">📤 SALIDA</div>
            ${item.deliveryInspection ? `
              <div><strong>Inspector:</strong> ${item.deliveryInspection.inspector?.firstname || ''} ${item.deliveryInspection.inspector?.lastname || ''}</div>
              <div><strong>Fecha:</strong> ${format(new Date(item.deliveryInspection.inspection_date), "dd/MM/yyyy HH:mm", { locale: es })}</div>
              <div><strong>Odómetro:</strong> ${item.deliveryInspection.odometer_reading || 0} km</div>
              <div><strong>Combustible:</strong> ${item.deliveryInspection.fuel_level || 'N/A'}</div>
              ${item.deliveryInspection.notes ? `<div><strong>Notas:</strong> ${item.deliveryInspection.notes}</div>` : ''}
            ` : '<div class="no-inspection">Sin inspección de salida</div>'}
          </div>
          <div class="metadata-column return-metadata">
            <div class="metadata-column-title">📥 REGRESO</div>
            ${item.returnInspection ? `
              <div><strong>Inspector:</strong> ${item.returnInspection.inspector?.firstname || ''} ${item.returnInspection.inspector?.lastname || ''}</div>
              <div><strong>Fecha:</strong> ${format(new Date(item.returnInspection.inspection_date), "dd/MM/yyyy HH:mm", { locale: es })}</div>
              <div><strong>Odómetro:</strong> ${item.returnInspection.odometer_reading || 0} km</div>
              <div><strong>Combustible:</strong> ${item.returnInspection.fuel_level || 'N/A'}</div>
              ${item.returnInspection.notes ? `<div><strong>Notas:</strong> ${item.returnInspection.notes}</div>` : ''}
            ` : '<div class="no-inspection">Sin inspección de regreso</div>'}
          </div>
        </div>
        
        <div class="perspectives-container">
          ${generatePerspectiveSection('🚗 VISTA FRONTAL', item.deliveryInspection, item.returnInspection, 'front_photo', true)}
          ${generatePerspectiveSection('⬅️ LATERAL IZQUIERDO', item.deliveryInspection, item.returnInspection, 'left_photo', false)}
          ${generatePerspectiveSection('🔙 VISTA TRASERA', item.deliveryInspection, item.returnInspection, 'rear_photo', false)}
          ${generatePerspectiveSection('➡️ LATERAL DERECHO', item.deliveryInspection, item.returnInspection, 'right_photo', false)}
          ${generatePerspectiveSection('⏱️ ODÓMETRO', item.deliveryInspection, item.returnInspection, 'odometer_photo', false)}
        </div>
      `).join('')}
      
      <div class="footer">
        <p><strong>ALQUILOSCOOTER</strong></p>
        <p>Documento generado el ${format(new Date(), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}</p>
      </div>
    </body>
    </html>
    `;

    const htmlBuffer = Buffer.from(html, 'utf-8');

    return new NextResponse(htmlBuffer, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline'
      }
    });

  } catch (error: any) {
    console.error('❌ [Inspección HTML] Error:', error);
    return NextResponse.json({ 
      error: 'Error generando HTML de inspección',
      message: error.message
    }, { status: 500 });
  }
}