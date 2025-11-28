/**
 * Generador de PDFs de inspección RESTAURADO
 * VUELVE A USAR html-pdf-node QUE FUNCIONABA EL 07/11/2025
 * - Template HTML → html-pdf-node → PDF
 * - Sin dependencias de Puppeteer/Chromium
 */

import { prisma } from '@/lib/db';
import { getFileAsCompressedBase64, getFileAsBuffer } from '@/lib/s3';
import { generateInspectionComparisonHTML } from '@/lib/inspections/comparison-template';
import { saveInspectionImagesToTempFiles, cleanupInspectionImageFiles, type InspectionImageFiles } from '@/lib/inspection-image-files';
import { generateInspectionHTMLFromFiles } from '@/lib/inspection-pdf-html-from-files';
import fs from 'fs';
import path from 'path';

// ⬅️ LOGGER PARA DIAGNÓSTICO
const logFilePath = path.join(process.cwd(), 'inspection_debug.log');
function debugLog(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  try {
    fs.appendFileSync(logFilePath, logMessage);
  } catch (e) {
    console.error('Error escribiendo log:', e);
  }
}

interface InspectionPDFData {
  inspection: any;
  booking: any;
  vehicle: any;
  customer: any;
}

/**
 * Genera HTML para PDF de inspección individual
 * ✅ NUEVO: Usa Base64 para imágenes (nunca expiran)
 */
/**
 * Genera HTML para PDF de inspección individual
 * VERSIÓN CORREGIDA: Usa <img src="data:image/jpeg;base64,..."> para imágenes
 */
export async function generateInspectionHTML(inspectionId: number): Promise<string> {
  try {
    debugLog(`[PDF Generator] Generando PDF para inspección ${inspectionId}.`);

    // Obtener datos completos de la inspección
    const inspection: any = await prisma.vehicleInspections.findUnique({
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
        vehicle: true,
        damages: true,
        extras: true,
        inspector: {
          select: {
            firstname: true,
            lastname: true,
            email: true
          }
        }
      }
    });

    if (!inspection) {
      throw new Error('Inspección no encontrada');
    }

    const booking = inspection.booking;
    const customer = booking?.customer;
    const vehicle = inspection.vehicle || booking?.vehicles?.[0]?.car;

    if (!booking || !customer || !vehicle) {
      throw new Error('Datos incompletos para generar PDF');
    }

    debugLog(`[PDF Generator] Convirtiendo imágenes a Base64.`);

    // Convertir imágenes a Base64 COMPRIMIDO (previene timeouts de Puppeteer)
    const getImageBase64 = async (s3Key: string | null): Promise<string | null> => {
      if (!s3Key) {
        debugLog(`[PDF Generator] s3Key vacío, saltando imagen.`);
        return null;
      }
      try {
        // Usar versión comprimida (800px, 75% calidad)
        const base64Data = await getFileAsCompressedBase64(s3Key, 800, 75);
        if (!base64Data) {
          debugLog(`[PDF Generator] getFileAsCompressedBase64 devolvió null para ${s3Key}`);
          return null;
        }
        // getFileAsCompressedBase64 ya devuelve formato "data:image/jpeg;base64,..."
        debugLog(`[PDF Generator] Imagen ${s3Key} convertida correctamente (${Math.round(base64Data.length / 1024)}KB)`);
        return base64Data;
      } catch (error) {
        console.error(`[PDF Generator] Error convirtiendo ${s3Key} a Base64:`, error);
        return null;
      }
    };

    const [frontImg, leftImg, rearImg, rightImg, odometerImg] = await Promise.all([
      getImageBase64(inspection.front_photo),
      getImageBase64(inspection.left_photo),
      getImageBase64(inspection.rear_photo),
      getImageBase64(inspection.right_photo),
      getImageBase64(inspection.odometer_photo)
    ]);

    const imageStatus = {
      frontImg: frontImg ? `OK (${Math.round(frontImg.length / 1024)}KB)` : 'NULL',
      leftImg: leftImg ? `OK (${Math.round(leftImg.length / 1024)}KB)` : 'NULL',
      rearImg: rearImg ? `OK (${Math.round(rearImg.length / 1024)}KB)` : 'NULL',
      rightImg: rightImg ? `OK (${Math.round(rightImg.length / 1024)}KB)` : 'NULL',
      odometerImg: odometerImg ? `OK (${Math.round(odometerImg.length / 1024)}KB)` : 'NULL'
    };
    debugLog(`[PDF Generator] Imágenes convertidas a Base64: ${JSON.stringify(imageStatus)}`);

    // Tipo de inspección en español
    const tipoInspeccion = inspection.inspection_type === 'DELIVERY' ? 'ENTREGA' : 'DEVOLUCIÓN';

    // Generar HTML del PDF
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

    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #333;
      padding: 20mm;
    }

    header {
      text-align: center;
      margin-bottom: 15px;
      padding-bottom: 20px;
      border-bottom: 2px solid #FF6825;
    }

    header h1 {
      color: #FF6825;
      font-size: 18pt;
      margin-bottom: 5px;
    }

    header h2 {
      color: #666;
      font-size: 12pt;
      font-weight: normal;
    }

    .info-section {
      margin: 15px 0;
      padding: 15px;
      background: #f9f9f9;
      border-left: 3px solid #FF6825;
    }

    .info-section h3 {
      color: #FF6825;
      font-size: 12pt;
      margin-bottom: 8px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      font-size: 10pt;
    }

    .info-item {
      padding: 4px 0;
    }

    .info-item strong {
      color: #333;
      display: inline-block;
      min-width: 120px;
    }

    .photos-section {
      margin: 20px 0;
    }

    .photos-section h3 {
      color: #FF6825;
      font-size: 12pt;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #ddd;
    }

    .photos-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-top: 15px;
    }

    .photo-item {
      text-align: center;
      page-break-inside: avoid;
    }

    .photo-item img {
      width: 100%;
      height: auto;
      max-height: 250px;
      object-fit: contain;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #f5f5f5;
    }

    .photo-item p {
      margin-top: 5px;
      font-size: 10pt;
      color: #666;
      font-weight: bold;
    }

    .damages-section {
      margin: 20px 0;
      page-break-inside: avoid;
    }

    .damages-section h3 {
      color: #FF6825;
      font-size: 12pt;
      margin-bottom: 8px;
    }

    .damage-item {
      margin: 8px 0;
      padding: 10px;
      background: #f9f9f9;
      border-left: 3px solid #FF6825;
    }

    .notes-section {
      margin: 20px 0;
      padding: 10px;
      background: #f9f9f9;
      border: 1px solid #d4d4d4;
      border-radius: 4px;
    }

    .notes-section h3 {
      color: #666;
      font-size: 12pt;
      margin-bottom: 8px;
    }

    footer {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 9pt;
      color: #888;
    }

    @media print {
      body {
        padding: 10mm;
      }
    }

    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>
  <header>
    <h1>INSPECCIÓN DE ${tipoInspeccion}</h1>
    <h2>Reserva: ${booking.booking_number}</h2>
  </header>

  <div class="info-section">
    <h3>Información de la Reserva</h3>
    <div class="info-grid">
      <div class="info-item"><strong>Reserva:</strong> ${booking.booking_number}</div>
      <div class="info-item"><strong>Fecha Inspección:</strong> ${new Date(inspection.inspection_date).toLocaleDateString('es-ES')}</div>
      <div class="info-item"><strong>Cliente:</strong> ${customer.first_name} ${customer.last_name}</div>
      <div class="info-item"><strong>DNI/NIE:</strong> ${customer.dni || 'N/A'}</div>
    </div>
  </div>

  <div class="info-section">
    <h3>Información del Vehículo</h3>
    <div class="info-grid">
      <div class="info-item"><strong>Marca/Modelo:</strong> ${vehicle.make} ${vehicle.model}</div>
      <div class="info-item"><strong>Matrícula:</strong> ${vehicle.registration_number}</div>
      <div class="info-item"><strong>Odómetro:</strong> ${inspection.odometer_reading || 'N/A'} km</div>
      <div class="info-item"><strong>Combustible:</strong> ${inspection.fuel_level || 'N/A'}</div>
      <div class="info-item"><strong>Estado General:</strong> ${inspection.general_condition || 'N/A'}</div>
      <div class="info-item"><strong>Inspector:</strong> ${inspection.inspector ? `${inspection.inspector.firstname} ${inspection.inspector.lastname}` : 'N/A'}</div>
    </div>
  </div>

  <div class="photos-section">
    <h3>Fotografías de la Inspección</h3>
    <div class="photos-grid">
      ${frontImg ? `
        <div class="photo-item">
          <img src="${frontImg}" alt="Vista frontal del vehículo" />
          <p>Vista Frontal</p>
        </div>
      ` : ''}
      ${leftImg ? `
        <div class="photo-item">
          <img src="${leftImg}" alt="Lado izquierdo del vehículo" />
          <p>Lado Izquierdo</p>
        </div>
      ` : ''}
      ${rearImg ? `
        <div class="photo-item">
          <img src="${rearImg}" alt="Vista trasera del vehículo" />
          <p>Vista Trasera</p>
        </div>
      ` : ''}
      ${rightImg ? `
        <div class="photo-item">
          <img src="${rightImg}" alt="Lado derecho del vehículo" />
          <p>Lado Derecho</p>
        </div>
      ` : ''}
      ${odometerImg ? `
        <div class="photo-item">
          <img src="${odometerImg}" alt="Odómetro del vehículo" />
          <p>Odómetro</p>
        </div>
      ` : ''}
    </div>
  </div>

  ${inspection.damages && inspection.damages.length > 0 ? `
    <div class="damages-section">
      <h3>Daños Registrados</h3>
      ${inspection.damages.map((damage: any) => `
        <div class="damage-item">
          <strong>Ubicación:</strong> ${damage.location}<br>
          <strong>Descripción:</strong> ${damage.description}<br>
          <strong>Severidad:</strong> ${damage.severity}
        </div>
      `).join('')}
    </div>
  ` : ''}

  ${inspection.notes ? `
    <div class="notes-section">
      <h3>Observaciones</h3>
      <p>${inspection.notes}</p>
    </div>
  ` : ''}

  <footer>
    <p>Documento generado automáticamente el ${new Date().toLocaleString('es-ES')}</p>
    <p>Este documento es un anexo a la reserva ${booking.booking_number}</p>
  </footer>
</body>
</html>
`;

    // DEBUG: Contar tags <img> y verificar HTML
    const imgTagCount = (html.match(/<img/g) || []).length;
    debugLog(`===== DEBUG HTML INSPECCIÓN =====`);
    debugLog(`HTML contiene ${imgTagCount} tags <img>`);
    debugLog(`Tamaño HTML: ${Math.round(html.length / 1024)}KB`);
    debugLog(`Primeros 500 caracteres: ${html.substring(0, 500)}`);
    debugLog(`===== FIN DEBUG HTML INSPECCIÓN =====`);

    return html;
  } catch (error) {
    console.error('[PDF Generator] Error generando HTML de inspección:', error);
    throw error;
  }
}

/**
 * Genera buffer PDF de una inspección usando Chrome del sistema con imágenes Base64
 * ✅ Solución definitiva: Base64 + Chrome real instalado (recomendación del asesor)
 */
export async function generateInspectionPDFBuffer(inspectionId: number): Promise<Buffer> {
  try {
    console.log(`📄 [PDF Inspección] Generando PDF para inspección ${inspectionId} con html-pdf-node...`);

    // 1) Cargar datos de inspección
    const inspection: any = await prisma.vehicleInspections.findUnique({
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
        vehicle: true,
        damages: true,
        extras: true,
        inspector: {
          select: {
            firstname: true,
            lastname: true,
            email: true
          }
        }
      }
    });

    if (!inspection) {
      throw new Error('Inspección no encontrada');
    }

    const booking = inspection.booking;
    const customer = booking?.customer;
    const vehicle = inspection.vehicle || booking?.vehicles?.[0]?.car;

    if (!booking || !customer || !vehicle) {
      throw new Error('Datos incompletos para generar PDF');
    }

    console.log(`📄 [PDF Inspección] Convirtiendo imágenes a Base64 comprimido...`);

    // 2) Convertir imágenes a Base64 COMPRIMIDO (800px, 75% calidad)
    const getImageBase64 = async (s3Key: string | null): Promise<string | null> => {
      if (!s3Key) {
        return null;
      }
      try {
        const base64Data = await getFileAsCompressedBase64(s3Key, 800, 75);
        if (!base64Data) {
          console.warn(`⚠️ [PDF Inspección] No se pudo convertir ${s3Key} a Base64`);
          return null;
        }
        console.log(`✅ [PDF Inspección] Imagen ${s3Key} convertida (${Math.round(base64Data.length / 1024)}KB)`);
        return base64Data;
      } catch (error) {
        console.error(`❌ [PDF Inspección] Error convirtiendo ${s3Key}:`, error);
        return null;
      }
    };

    const [frontImg, leftImg, rearImg, rightImg, odometerImg] = await Promise.all([
      getImageBase64(inspection.front_photo),
      getImageBase64(inspection.left_photo),
      getImageBase64(inspection.rear_photo),
      getImageBase64(inspection.right_photo),
      getImageBase64(inspection.odometer_photo)
    ]);

    const imageStatus = {
      frontImg: frontImg ? `OK (${Math.round(frontImg.length / 1024)}KB)` : 'NULL',
      leftImg: leftImg ? `OK (${Math.round(leftImg.length / 1024)}KB)` : 'NULL',
      rearImg: rearImg ? `OK (${Math.round(rearImg.length / 1024)}KB)` : 'NULL',
      rightImg: rightImg ? `OK (${Math.round(rightImg.length / 1024)}KB)` : 'NULL',
      odometerImg: odometerImg ? `OK (${Math.round(odometerImg.length / 1024)}KB)` : 'NULL'
    };
    console.log(`📄 [PDF Inspección] Estado de imágenes:`, imageStatus);

    // 3) Generar HTML con imágenes Base64
    const tipoInspeccion = inspection.inspection_type === 'DELIVERY' ? 'ENTREGA' : 'DEVOLUCIÓN';
    
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Inspección ${booking.booking_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11pt; padding: 20px; }
    h1 { color: #FF6B35; margin-bottom: 20px; font-size: 18pt; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 14pt; font-weight: bold; margin-bottom: 10px; color: #333; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f8f8f8; font-weight: bold; }
    .photos-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px; }
    .photo-item { text-align: center; }
    .photo-item img { max-width: 100%; height: auto; border: 1px solid #ddd; }
    .photo-label { margin-top: 5px; font-size: 10pt; color: #666; }
  </style>
</head>
<body>
  <h1>INSPECCIÓN DE ${tipoInspeccion}</h1>
  
  <div class="section">
    <div class="section-title">Información de la Reserva</div>
    <table>
      <tr><th>Nº Reserva</th><td>${booking.booking_number}</td></tr>
      <tr><th>Fecha Inspección</th><td>${new Date(inspection.inspection_date).toLocaleDateString('es-ES')}</td></tr>
      <tr><th>Cliente</th><td>${customer.first_name} ${customer.last_name}</td></tr>
      <tr><th>DNI/ID</th><td>${customer.dni || 'N/A'}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Información del Vehículo</div>
    <table>
      <tr><th>Vehículo</th><td>${vehicle.make} ${vehicle.model}</td></tr>
      <tr><th>Matrícula</th><td>${vehicle.registration_number}</td></tr>
      <tr><th>Kilómetros</th><td>${inspection.odometer_reading || 'N/A'}</td></tr>
      <tr><th>Nivel Combustible</th><td>${inspection.fuel_level || 'N/A'}</td></tr>
      <tr><th>Estado General</th><td>${inspection.general_condition || 'N/A'}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Fotografías de Inspección</div>
    <div class="photos-grid">
      ${frontImg ? `<div class="photo-item"><img src="${frontImg}" alt="Frontal"/><div class="photo-label">Frontal</div></div>` : '<div class="photo-item"><div class="photo-label">Sin foto frontal</div></div>'}
      ${leftImg ? `<div class="photo-item"><img src="${leftImg}" alt="Lateral Izquierdo"/><div class="photo-label">Lateral Izquierdo</div></div>` : '<div class="photo-item"><div class="photo-label">Sin foto lateral izquierda</div></div>'}
      ${rearImg ? `<div class="photo-item"><img src="${rearImg}" alt="Trasera"/><div class="photo-label">Trasera</div></div>` : '<div class="photo-item"><div class="photo-label">Sin foto trasera</div></div>'}
      ${rightImg ? `<div class="photo-item"><img src="${rightImg}" alt="Lateral Derecho"/><div class="photo-label">Lateral Derecho</div></div>` : '<div class="photo-item"><div class="photo-label">Sin foto lateral derecha</div></div>'}
    </div>
    ${odometerImg ? `<div style="margin-top: 20px; text-align: center;"><img src="${odometerImg}" alt="Odómetro" style="max-width: 400px; border: 1px solid #ddd;"/><div class="photo-label">Odómetro</div></div>` : ''}
  </div>

  <div class="section" style="margin-top: 30px; font-size: 10pt; color: #666;">
    <p>Inspector: ${inspection.inspector ? `${inspection.inspector.firstname} ${inspection.inspector.lastname}` : 'N/A'}</p>
    <p>Documento generado el ${new Date().toLocaleString('es-ES')}</p>
  </div>
</body>
</html>`;

    console.log(`📄 [PDF Inspección] HTML generado con Base64 (${Math.round(html.length / 1024)}KB)`);

    // 4) Generar PDF con html-pdf-node (funcionaba el 07/11/2025)
    console.log('📄 [PDF Inspección] Generando PDF con html-pdf-node...');
    const htmlPdf = require('html-pdf-node');
    
    const options = { 
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    };
    
    const file = { content: html };
    const pdfBuffer = await htmlPdf.generatePdf(file, options);

    console.log(`✅ [PDF Inspección] PDF generado exitosamente (${Math.round(pdfBuffer.length / 1024)}KB)`);
    return pdfBuffer;
  } catch (error: any) {
    console.error('❌ [PDF Inspección] Error:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * ✅ NUEVA FUNCIÓN UNIFICADA: Genera PDF COMPARATIVO de inspecciones
 * Usa la misma arquitectura que los contratos:
 * 1. Genera HTML usando template
 * 2. Convierte imágenes a Base64
 * 3. Usa motor PDF compartido (generateContractPDF)
 */
export async function generateInspectionComparisonPDF(inspectionId: number): Promise<Buffer> {
  try {
    console.log(`📊 [PDF Comparativo] Generando PDF comparativo para inspección ${inspectionId}...`);
    
    // 1. Obtener datos de la inspección (debe ser una inspección de DEVOLUCIÓN)
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
        vehicle: true,
        damages: true
      }
    });

    if (!inspection) {
      throw new Error('Inspección no encontrada');
    }

    const booking = inspection.booking;
    const customer = booking.customer;
    const vehicle = inspection.vehicle || booking.vehicles[0]?.car;

    if (!booking || !customer || !vehicle) {
      throw new Error('Datos incompletos para generar PDF comparativo');
    }

    // 2. Buscar inspección de ENTREGA correspondiente
    const deliveryInspection = await prisma.vehicleInspections.findFirst({
      where: {
        booking_id: booking.id,
        vehicle_id: vehicle.id,
        inspection_type: { in: ['delivery', 'DELIVERY', 'CHECKIN'] }
      },
      orderBy: {
        inspection_date: 'asc'
      }
    });

    if (!deliveryInspection) {
      throw new Error('Inspección de entrega no encontrada');
    }

    console.log(`📸 [PDF Comparativo] Convirtiendo imágenes a Base64...`);
    
    // 3. Convertir TODAS las imágenes a Base64 COMPRIMIDO
    const convertToBase64 = async (s3Key: string | null): Promise<string | null> => {
      if (!s3Key) return null;
      try {
        const base64Data = await getFileAsCompressedBase64(s3Key, 800, 75);
        return base64Data;
      } catch (error) {
        console.error(`❌ Error convirtiendo ${s3Key}:`, error);
        return null;
      }
    };

    // Convertir imágenes de ENTREGA
    const [deliveryFront, deliveryLeft, deliveryRear, deliveryRight, deliveryOdometer] = await Promise.all([
      convertToBase64(deliveryInspection.front_photo),
      convertToBase64(deliveryInspection.left_photo),
      convertToBase64(deliveryInspection.rear_photo),
      convertToBase64(deliveryInspection.right_photo),
      convertToBase64(deliveryInspection.odometer_photo)
    ]);

    // Convertir imágenes de DEVOLUCIÓN
    const [returnFront, returnLeft, returnRear, returnRight, returnOdometer] = await Promise.all([
      convertToBase64(inspection.front_photo),
      convertToBase64(inspection.left_photo),
      convertToBase64(inspection.rear_photo),
      convertToBase64(inspection.right_photo),
      convertToBase64(inspection.odometer_photo)
    ]);

    console.log(`✅ [PDF Comparativo] Imágenes convertidas a Base64`);

    // 4. Preparar datos con imágenes Base64
    const deliveryWithBase64 = {
      ...deliveryInspection,
      front_photo: deliveryFront,
      left_photo: deliveryLeft,
      rear_photo: deliveryRear,
      right_photo: deliveryRight,
      odometer_photo: deliveryOdometer
    };

    const returnWithBase64 = {
      ...inspection,
      front_photo: returnFront,
      left_photo: returnLeft,
      rear_photo: returnRear,
      right_photo: returnRight,
      odometer_photo: returnOdometer
    };

    // 5. Generar HTML usando el template
    console.log(`📄 [PDF Comparativo] Generando HTML desde template...`);
    const html = generateInspectionComparisonHTML({
      booking,
      customer,
      vehicle,
      deliveryInspection: deliveryWithBase64,
      returnInspection: returnWithBase64
    });

    console.log(`📄 [PDF Comparativo] HTML generado (${Math.round(html.length / 1024)}KB)`);

    // 6. Generar PDF con html-pdf-node (funcionaba el 07/11/2025)
    console.log(`📄 [PDF Comparativo] Generando PDF con html-pdf-node...`);
    
    const htmlPdf = require('html-pdf-node');
    
    const options = { 
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      }
    };
    
    const file = { content: html };
    const pdfBuffer = await htmlPdf.generatePdf(file, options);

    console.log(`✅ [PDF Comparativo] PDF generado exitosamente (${Math.round(pdfBuffer.length / 1024)}KB)`);
    
    return pdfBuffer;
  } catch (error: any) {
    console.error('❌ [PDF Comparativo] Error completo:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}