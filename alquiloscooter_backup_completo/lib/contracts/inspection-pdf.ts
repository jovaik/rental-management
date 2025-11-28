// Generador de PDF de Inspección Individual
// Para enviar inspecciones de entrega/devolución por separado
import { ContractLanguage, getTranslations } from './translations';

interface InspectionData {
  odometerReading?: number;
  fuelLevel?: string;
  generalCondition?: string;
  notes?: string;
  frontPhoto?: string;
  leftPhoto?: string;
  rearPhoto?: string;
  rightPhoto?: string;
  odometerPhoto?: string;
  inspectionDate?: string;
  inspectorName?: string;
}

interface InspectionPDFData {
  bookingNumber: string;
  contractNumber?: string;
  customerFullname: string;
  vehicleRegistration: string;
  vehicleMake: string;
  vehicleModel: string;
  inspectionType: 'delivery' | 'return'; // Entrega o Devolución
  inspection: InspectionData;
  
  // Branding
  primaryColor?: string;
  secondaryColor?: string;
  logoBase64?: string | null;
  companyName?: string;
  language?: ContractLanguage;
}

export function generateInspectionPDF_HTML(data: InspectionPDFData): string {
  const lang = data.language || 'es';
  const t = getTranslations(lang);
  
  const primaryColor = data.primaryColor || '#FF6B35';
  const secondaryColor = data.secondaryColor || '#FF8C42';
  
  const logoHtml = data.logoBase64
    ? `<img src="${data.logoBase64}" alt="${data.companyName || 'Alquilo Scooter'}" class="logo-image">`
    : `<div class="logo-text">${data.companyName || 'Alquilo Scooter'}</div>`;

  const inspectionTypeLabel = data.inspectionType === 'delivery' ? t.deliveryInspection : t.returnInspection;
  
  const fuelLevelMap: Record<string, string> = {
    empty: lang === 'es' ? 'Vacío' : 'Empty',
    quarter: lang === 'es' ? '1/4' : '1/4',
    half: lang === 'es' ? '1/2' : '1/2',
    three_quarters: lang === 'es' ? '3/4' : '3/4',
    full: lang === 'es' ? 'Lleno' : 'Full'
  };

  const fuelLevelText = data.inspection.fuelLevel 
    ? fuelLevelMap[data.inspection.fuelLevel] || data.inspection.fuelLevel
    : 'N/A';

  // Fotos con tamaño grande
  const photos = [
    { label: t.front, src: data.inspection.frontPhoto },
    { label: t.leftSide, src: data.inspection.leftPhoto },
    { label: t.rear, src: data.inspection.rearPhoto },
    { label: t.rightSide, src: data.inspection.rightPhoto },
    { label: t.odometer, src: data.inspection.odometerPhoto }
  ].filter(photo => photo.src);

  const photosHTML = photos.map(photo => `
    <div style="margin-bottom: 15px; page-break-inside: avoid;">
      <div style="font-size: 10px; font-weight: bold; margin-bottom: 5px; color: ${primaryColor};">
        📸 ${photo.label}
      </div>
      <div style="border: 2px solid #e2e8f0; padding: 5px; background: white;">
        <img src="${photo.src}" style="width: 100%; height: auto; display: block;" />
      </div>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${inspectionTypeLabel} - ${data.vehicleRegistration}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    @page {
      size: A4;
      margin: 15mm;
    }
    
    body {
      font-family: Arial, sans-serif;
      font-size: 10px;
      line-height: 1.4;
      color: #1a202c;
    }
    
    .logo-container {
      text-align: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid ${primaryColor};
    }
    
    .logo-image {
      max-height: 50px;
      width: auto;
    }
    
    .logo-text {
      font-size: 20px;
      font-weight: bold;
      color: ${primaryColor};
    }
    
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .section-title {
      background: ${primaryColor};
      color: white;
      padding: 10px 15px;
      font-size: 12px;
      font-weight: bold;
      margin: 15px 0 10px 0;
      border-radius: 4px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-bottom: 15px;
    }
    
    .info-item {
      padding: 8px;
      background: #f7fafc;
      border-left: 3px solid ${primaryColor};
    }
    
    .info-label {
      font-size: 8px;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .info-value {
      font-size: 10px;
      font-weight: 600;
      color: #2d3748;
      margin-top: 2px;
    }
  </style>
</head>
<body>
  <div class="logo-container">
    ${logoHtml}
  </div>
  
  <div class="header">
    <div style="font-size: 18px; font-weight: bold; color: ${primaryColor}; margin-bottom: 5px;">
      ${inspectionTypeLabel}
    </div>
    <div style="font-size: 12px; color: #718096;">
      ${data.vehicleMake} ${data.vehicleModel} - ${data.vehicleRegistration}
    </div>
    <div style="font-size: 10px; color: #718096; margin-top: 5px;">
      ${t.bookingNumber}: ${data.bookingNumber}
      ${data.contractNumber ? ` | ${t.contractNumber}: ${data.contractNumber}` : ''}
    </div>
  </div>

  <div class="section-title">${t.vehicleInformation}</div>
  <div class="info-grid">
    <div class="info-item">
      <div class="info-label">${t.customer}</div>
      <div class="info-value">${data.customerFullname}</div>
    </div>
    <div class="info-item">
      <div class="info-label">${t.vehicle}</div>
      <div class="info-value">${data.vehicleMake} ${data.vehicleModel}</div>
    </div>
    <div class="info-item">
      <div class="info-label">${t.registration}</div>
      <div class="info-value">${data.vehicleRegistration}</div>
    </div>
    <div class="info-item">
      <div class="info-label">${t.inspectionDate}</div>
      <div class="info-value">${data.inspection.inspectionDate || 'N/A'}</div>
    </div>
  </div>

  <div class="section-title">${t.inspectionData}</div>
  <div class="info-grid">
    <div class="info-item">
      <div class="info-label">${t.odometer}</div>
      <div class="info-value">${data.inspection.odometerReading || 'N/A'} km</div>
    </div>
    <div class="info-item">
      <div class="info-label">${t.fuelLevel}</div>
      <div class="info-value">${fuelLevelText}</div>
    </div>
    ${data.inspection.inspectorName ? `
      <div class="info-item">
        <div class="info-label">${t.inspector || 'Inspector'}</div>
        <div class="info-value">${data.inspection.inspectorName}</div>
      </div>
    ` : ''}
  </div>

  ${data.inspection.generalCondition ? `
    <div class="info-item" style="margin: 10px 0;">
      <div class="info-label">${t.generalCondition}</div>
      <div class="info-value">${data.inspection.generalCondition}</div>
    </div>
  ` : ''}

  ${data.inspection.notes ? `
    <div class="info-item" style="margin: 10px 0;">
      <div class="info-label">${t.notes}</div>
      <div class="info-value">${data.inspection.notes}</div>
    </div>
  ` : ''}

  <div class="section-title">📸 ${t.photos || 'Fotografías'}</div>
  ${photosHTML}

  <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 8px; color: #718096;">
    <p>${data.companyName || 'Alquilo Scooter'}</p>
    <p style="margin-top: 3px;">${inspectionTypeLabel} - ${data.vehicleRegistration}</p>
    <p style="margin-top: 3px;">${data.inspection.inspectionDate || ''}</p>
  </div>
</body>
</html>
  `;
}
