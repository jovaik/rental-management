
import { getFileAsCompressedBase64 } from '@/lib/s3'; // ✅ Usar Base64 COMPRIMIDO para PDFs

interface InspectionPhoto {
  label: string;
  url: string | null;
}

interface Inspection {
  id: number;
  inspection_type: string;
  inspection_date: string;
  odometer_reading: number;
  fuel_level: string;
  front_photo: string | null;
  left_photo: string | null;
  rear_photo: string | null;
  right_photo: string | null;
  odometer_photo: string | null;
  general_condition: string | null;
  notes: string | null;
  inspector: {
    firstname: string | null;
    lastname: string | null;
  };
}

interface Vehicle {
  registration_number: string;
  make: string;
  model: string;
}

interface InspectionPDFData {
  bookingNumber: string;
  vehicle: Vehicle;
  deliveryInspection: Inspection | null;
  returnInspection: Inspection | null;
  companyName: string;
}

/**
 * ✅ Convierte imagen de S3 a Base64 COMPRIMIDO (800px, 75% calidad)
 * Las imágenes comprimidas previenen timeouts y errores de memoria en Puppeteer
 */
async function getImageBase64(s3Key: string | null): Promise<string> {
  if (!s3Key) {
    console.log('⚠️  S3 Key vacío, saltando conversión');
    return '';
  }

  try {
    console.log(`📸 [Base64] Convirtiendo comprimido: ${s3Key}`);
    
    // ✅ Usar versión COMPRIMIDA para reducir tamaño del HTML/PDF
    const base64Data = await getFileAsCompressedBase64(s3Key, 800, 75);
    
    if (!base64Data) {
      console.warn(`⚠️  [Base64] No se obtuvo datos: ${s3Key}`);
      return '';
    }
    
    console.log(`✅ [Base64] Convertido comprimido exitosamente`);
    
    // getFileAsCompressedBase64 ya devuelve "data:image/jpeg;base64,..."
    return base64Data;
  } catch (error: any) {
    console.error(`❌ [Base64] Error: ${s3Key}`, {
      message: error.message,
      code: error.code,
      name: error.name
    });
    // Retornar string vacío para que el PDF se genere sin esta foto
    return '';
  }
}

/**
 * Obtiene el label del nivel de combustible
 */
function getFuelLevelLabel(level: string): string {
  const labels: { [key: string]: string } = {
    empty: 'Vacío',
    quarter: '1/4',
    half: '1/2',
    three_quarters: '3/4',
    full: 'Lleno'
  };
  return labels[level] || level;
}

/**
 * Genera el HTML del PDF de inspección
 */
async function generateInspectionHTML(data: InspectionPDFData): Promise<string> {
  const { bookingNumber, vehicle, deliveryInspection, returnInspection, companyName } = data;

  // Preparar fotos de entrega
  const deliveryPhotos: InspectionPhoto[] = deliveryInspection ? [
    { label: 'Frontal', url: deliveryInspection.front_photo },
    { label: 'Lateral Izquierdo', url: deliveryInspection.left_photo },
    { label: 'Trasera', url: deliveryInspection.rear_photo },
    { label: 'Lateral Derecho', url: deliveryInspection.right_photo },
    { label: 'Cuentakilómetros', url: deliveryInspection.odometer_photo }
  ] : [];

  // Preparar fotos de devolución
  const returnPhotos: InspectionPhoto[] = returnInspection ? [
    { label: 'Frontal', url: returnInspection.front_photo },
    { label: 'Lateral Izquierdo', url: returnInspection.left_photo },
    { label: 'Trasera', url: returnInspection.rear_photo },
    { label: 'Lateral Derecho', url: returnInspection.right_photo },
    { label: 'Cuentakilómetros', url: returnInspection.odometer_photo }
  ] : [];

  // ✅ Convertir todas las fotos a Base64 (PERMANENTES, nunca caducan)
  console.log('📸 [PDF Comparativo] Convirtiendo fotos a Base64...');
  const deliveryUrls: { [key: string]: string } = {};
  const returnUrls: { [key: string]: string } = {};

  for (const photo of deliveryPhotos) {
    if (photo.url) {
      deliveryUrls[photo.label] = await getImageBase64(photo.url);
    }
  }

  for (const photo of returnPhotos) {
    if (photo.url) {
      returnUrls[photo.label] = await getImageBase64(photo.url);
    }
  }
  
  console.log(`✅ [PDF Comparativo] ${Object.keys(deliveryUrls).length + Object.keys(returnUrls).length} fotos convertidas`);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      padding: 30px;
      background: white;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #FF6B35;
    }
    
    .header h1 {
      color: #FF6B35;
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    .header h2 {
      color: #333;
      font-size: 20px;
      margin-bottom: 5px;
    }
    
    .header p {
      color: #666;
      font-size: 14px;
    }
    
    .vehicle-info {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 30px;
      border-left: 4px solid #FF6B35;
    }
    
    .vehicle-info h3 {
      color: #333;
      font-size: 18px;
      margin-bottom: 10px;
    }
    
    .vehicle-info p {
      color: #666;
      font-size: 14px;
      margin: 5px 0;
    }
    
    .comparison-headers {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .comparison-header {
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    
    .comparison-header.delivery {
      background: #d1fae5;
      border: 2px solid #10b981;
    }
    
    .comparison-header.return {
      background: #dbeafe;
      border: 2px solid #3b82f6;
    }
    
    .comparison-header h3 {
      font-size: 18px;
      margin-bottom: 5px;
    }
    
    .comparison-header.delivery h3 {
      color: #065f46;
    }
    
    .comparison-header.return h3 {
      color: #1e40af;
    }
    
    .comparison-header p {
      font-size: 12px;
      color: #666;
    }
    
    .inspection-section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    
    .section-title {
      background: linear-gradient(to right, #f3f4f6, #e5e7eb);
      padding: 8px 15px;
      border-radius: 6px;
      text-align: center;
      margin-bottom: 12px;
      border: 2px solid #d1d5db;
    }
    
    .section-title h4 {
      color: #1f2937;
      font-size: 14px;
      font-weight: bold;
    }
    
    .photo-comparison {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 15px;
    }
    
    .photo-box {
      padding: 8px;
      border-radius: 6px;
    }
    
    .photo-box.delivery {
      background: rgba(209, 250, 229, 0.3);
      border: 1px solid #10b981;
    }
    
    .photo-box.return {
      background: rgba(219, 234, 254, 0.3);
      border: 1px solid #3b82f6;
    }
    
    .photo-box img {
      width: 100%;
      height: 180px;
      object-fit: contain;
      background: white;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
    }
    
    .photo-box.empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 180px;
      background: #f9fafb;
      border: 2px dashed #d1d5db;
    }
    
    .photo-box.empty p {
      color: #9ca3af;
      font-size: 12px;
    }
    
    .photo-label {
      text-align: center;
      font-size: 11px;
      font-weight: 600;
      color: #666;
      margin-top: 5px;
    }
    
    .inspection-data {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 30px;
      padding-top: 30px;
      border-top: 2px solid #e5e7eb;
    }
    
    .data-box {
      padding: 15px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    
    .data-box h4 {
      font-size: 16px;
      margin-bottom: 15px;
      color: #333;
    }
    
    .data-row {
      margin-bottom: 10px;
    }
    
    .data-row .label {
      font-size: 12px;
      color: #666;
      margin-bottom: 3px;
    }
    
    .data-row .value {
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }
    
    .photos-page {
      page-break-after: always;
    }
    
    .photos-page:last-child {
      page-break-after: auto;
    }
    
    @media print {
      .photos-page {
        page-break-after: always;
      }
      
      .photos-page:last-child {
        page-break-after: auto;
      }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <h1>${companyName}</h1>
    <h2>Informe de Inspección de Vehículo</h2>
    <p>Reserva: <strong>${bookingNumber}</strong></p>
  </div>
  
  <!-- Vehicle Info -->
  <div class="vehicle-info">
    <h3>🚗 Información del Vehículo</h3>
    <p><strong>Matrícula:</strong> ${vehicle.registration_number}</p>
    <p><strong>Marca/Modelo:</strong> ${vehicle.make} ${vehicle.model}</p>
  </div>
  
  <!-- Comparison Headers -->
  <div class="comparison-headers">
    <div class="comparison-header delivery">
      <h3>✅ Entrega</h3>
      ${deliveryInspection ? `<p>${new Date(deliveryInspection.inspection_date).toLocaleDateString('es-ES')}</p>` : '<p>Sin inspección</p>'}
    </div>
    <div class="comparison-header return">
      <h3>🔄 Devolución</h3>
      ${returnInspection ? `<p>${new Date(returnInspection.inspection_date).toLocaleDateString('es-ES')}</p>` : '<p>Sin inspección</p>'}
    </div>
  </div>
  
  <!-- Photo Comparisons - PÁGINA 1: Frontal + Laterales -->
  <div class="photos-page">
    ${['Frontal', 'Lateral Izquierdo', 'Lateral Derecho'].map(position => `
      <div class="inspection-section">
        <div class="section-title">
          <h4>📸 ${position}</h4>
        </div>
        <div class="photo-comparison">
          <div class="photo-box delivery ${deliveryUrls[position] ? '' : 'empty'}">
            ${deliveryUrls[position] 
              ? `<img src="${deliveryUrls[position]}" alt="${position} - Entrega" />`
              : '<p>Sin foto</p>'
            }
            <div class="photo-label">Entrega</div>
          </div>
          <div class="photo-box return ${returnUrls[position] ? '' : 'empty'}">
            ${returnUrls[position] 
              ? `<img src="${returnUrls[position]}" alt="${position} - Devolución" />`
              : '<p>Sin foto</p>'
            }
            <div class="photo-label">Devolución</div>
          </div>
        </div>
      </div>
    `).join('')}
  </div>
  
  <!-- Photo Comparisons - PÁGINA 2: Trasera + Odómetro -->
  <div class="photos-page">
    ${['Trasera', 'Cuentakilómetros'].map(position => `
      <div class="inspection-section">
        <div class="section-title">
          <h4>📸 ${position}</h4>
        </div>
        <div class="photo-comparison">
          <div class="photo-box delivery ${deliveryUrls[position] ? '' : 'empty'}">
            ${deliveryUrls[position] 
              ? `<img src="${deliveryUrls[position]}" alt="${position} - Entrega" />`
              : '<p>Sin foto</p>'
            }
            <div class="photo-label">Entrega</div>
          </div>
          <div class="photo-box return ${returnUrls[position] ? '' : 'empty'}">
            ${returnUrls[position] 
              ? `<img src="${returnUrls[position]}" alt="${position} - Devolución" />`
              : '<p>Sin foto</p>'
            }
            <div class="photo-label">Devolución</div>
          </div>
        </div>
      </div>
    `).join('')}
  </div>
  
  <!-- Inspection Data -->
  ${(deliveryInspection || returnInspection) ? `
    <div class="inspection-data">
      ${deliveryInspection ? `
        <div class="data-box">
          <h4>📋 Datos de Entrega</h4>
          <div class="data-row">
            <div class="label">Kilometraje</div>
            <div class="value">${deliveryInspection.odometer_reading.toLocaleString()} km</div>
          </div>
          <div class="data-row">
            <div class="label">Combustible</div>
            <div class="value">${getFuelLevelLabel(deliveryInspection.fuel_level)}</div>
          </div>
          ${deliveryInspection.general_condition ? `
            <div class="data-row">
              <div class="label">Estado General</div>
              <div class="value">${deliveryInspection.general_condition}</div>
            </div>
          ` : ''}
          ${deliveryInspection.notes ? `
            <div class="data-row">
              <div class="label">Notas</div>
              <div class="value">${deliveryInspection.notes}</div>
            </div>
          ` : ''}
          <div class="data-row">
            <div class="label">Inspector</div>
            <div class="value">${deliveryInspection.inspector.firstname || ''} ${deliveryInspection.inspector.lastname || ''}</div>
          </div>
        </div>
      ` : ''}
      
      ${returnInspection ? `
        <div class="data-box">
          <h4>📋 Datos de Devolución</h4>
          <div class="data-row">
            <div class="label">Kilometraje</div>
            <div class="value">${returnInspection.odometer_reading.toLocaleString()} km</div>
          </div>
          <div class="data-row">
            <div class="label">Combustible</div>
            <div class="value">${getFuelLevelLabel(returnInspection.fuel_level)}</div>
          </div>
          ${returnInspection.general_condition ? `
            <div class="data-row">
              <div class="label">Estado General</div>
              <div class="value">${returnInspection.general_condition}</div>
            </div>
          ` : ''}
          ${returnInspection.notes ? `
            <div class="data-row">
              <div class="label">Notas</div>
              <div class="value">${returnInspection.notes}</div>
            </div>
          ` : ''}
          <div class="data-row">
            <div class="label">Inspector</div>
            <div class="value">${returnInspection.inspector.firstname || ''} ${returnInspection.inspector.lastname || ''}</div>
          </div>
        </div>
      ` : ''}
    </div>
  ` : ''}
</body>
</html>
  `.trim();
}

/**
 * Genera un PDF de inspección
 * @returns Buffer del PDF generado
 */
export async function generateInspectionPDF(data: InspectionPDFData): Promise<Buffer> {
  try {
    console.log('📄 [PDF Inspección] ========== INICIO ==========');
    console.log('📄 [PDF Inspección] Datos recibidos:', {
      bookingNumber: data.bookingNumber,
      vehicle: data.vehicle,
      hasDelivery: !!data.deliveryInspection,
      hasReturn: !!data.returnInspection
    });
    
    console.log('📄 [PDF Inspección] PASO 1: Generando HTML...');
    const html = await generateInspectionHTML(data);
    console.log(`📄 [PDF Inspección] ✅ HTML generado (${Math.round(html.length / 1024)}KB)`);
    
    console.log('📄 [PDF Inspección] PASO 2: Generando PDF con html-pdf-node...');
    const htmlPdf = require('html-pdf-node');
    
    const options = { 
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    };
    
    const file = { content: html };
    const pdfBuffer = await htmlPdf.generatePdf(file, options);
    
    console.log(`✅ [PDF Inspección] PDF generado exitosamente (${Math.round(pdfBuffer.length / 1024)}KB)`);
    console.log('📄 [PDF Inspección] ========== FIN ==========');
    return Buffer.from(pdfBuffer);
    
  } catch (error: any) {
    console.error('❌ [PDF Inspección] ========== ERROR ==========');
    console.error('❌ [PDF Inspección] Tipo de error:', error.constructor.name);
    console.error('❌ [PDF Inspección] Mensaje:', error.message);
    console.error('❌ [PDF Inspección] Stack completo:', error.stack);
    console.error('❌ [PDF Inspección] Código:', error.code || 'N/A');
    console.error('❌ [PDF Inspección] Errno:', error.errno || 'N/A');
    console.error('❌ [PDF Inspección] ==============================');
    throw new Error(`Error generando PDF: ${error.message}`);
  }
}
