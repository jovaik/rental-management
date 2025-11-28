
// Anexo de Inspecciones con Fotos a Gran Tamaño
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
}

interface InspectionAnnexData {
  contractNumber: string;
  bookingNumber: string;
  customerFullname: string;
  vehicleRegistration: string;
  vehicleMake: string;
  vehicleModel: string;
  deliveryInspection?: InspectionData;
  returnInspection?: InspectionData;
  language?: ContractLanguage;
  primaryColor?: string;
  secondaryColor?: string;
  logoBase64?: string | null;
  companyName?: string;
}

export function generateInspectionAnnexHTML(data: InspectionAnnexData): string {
  const lang = data.language || 'es';
  const t = getTranslations(lang);
  const primaryColor = data.primaryColor || '#FF6B35';
  const secondaryColor = data.secondaryColor || '#f59e0b';
  
  const logoHtml = data.logoBase64
    ? `<img src="${data.logoBase64}" alt="${data.companyName || 'Logo'}" class="logo-image">`
    : `<div class="logo-text">${data.companyName || 'RENTAL'}</div>`;
  
  const fuelLevelMap: Record<string, string> = {
    empty: lang === 'es' ? 'Vacío' : 'Empty',
    quarter: lang === 'es' ? '1/4' : '1/4',
    half: lang === 'es' ? '1/2' : '1/2',
    three_quarters: lang === 'es' ? '3/4' : '3/4',
    full: lang === 'es' ? 'Lleno' : 'Full'
  };
  
  // Función para generar una fila de fotos comparativas (grande)
  const generatePhotoRow = (label: string, deliveryUrl?: string, returnUrl?: string) => {
    return `
      <div class="photo-comparison-row">
        <div class="photo-label-row">${label}</div>
        <div class="photos-grid-large">
          <div class="photo-large-container">
            ${deliveryUrl 
              ? `<img src="${deliveryUrl}" alt="${label} ${t.deliveryInspection}">` 
              : '<div class="no-photo-large">Sin foto</div>'
            }
          </div>
          <div class="photo-large-container">
            ${returnUrl 
              ? `<img src="${returnUrl}" alt="${label} ${t.returnInspection}">` 
              : '<div class="no-photo-large">Sin foto</div>'
            }
          </div>
        </div>
      </div>
    `;
  };
  
  // Función para generar info de una inspección
  const generateInspectionInfo = (inspection: InspectionData | undefined, isDelivery: boolean) => {
    if (!inspection) return '<p style="text-align: center; color: #94a3b8;">Sin datos de inspección</p>';
    
    return `
      <div class="annex-info-grid">
        ${inspection.inspectionDate ? `
          <div class="annex-info-item">
            <span class="annex-info-label">${t.inspectionDate}:</span>
            <span class="annex-info-value">${inspection.inspectionDate}</span>
          </div>
        ` : ''}
        ${inspection.odometerReading ? `
          <div class="annex-info-item">
            <span class="annex-info-label">${t.inspectionOdometer}:</span>
            <span class="annex-info-value">${inspection.odometerReading} km</span>
          </div>
        ` : ''}
        ${inspection.fuelLevel ? `
          <div class="annex-info-item">
            <span class="annex-info-label">${t.inspectionFuel}:</span>
            <span class="annex-info-value">${fuelLevelMap[inspection.fuelLevel] || inspection.fuelLevel}</span>
          </div>
        ` : ''}
      </div>
      ${inspection.generalCondition ? `
        <div class="annex-notes-section">
          <div class="annex-notes-title">${t.inspectionCondition}:</div>
          <p class="annex-notes-text">${inspection.generalCondition}</p>
        </div>
      ` : ''}
      ${inspection.notes ? `
        <div class="annex-notes-section">
          <div class="annex-notes-title">${t.inspectionNotes}:</div>
          <p class="annex-notes-text">${inspection.notes}</p>
        </div>
      ` : ''}
    `;
  };
  
  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>Anexo de Inspecciones - ${data.contractNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: white; padding: 20px; color: #1e293b; line-height: 1.6; font-size: 12px; }
    .container { max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 4px solid ${primaryColor}; }
    .logo-section { flex: 1; }
    .logo-image { max-width: 400px; max-height: 160px; width: auto; height: auto; margin-bottom: 0; object-fit: contain; }
    .logo-text { font-size: 32px; font-weight: bold; color: ${primaryColor}; margin-bottom: 6px; }
    .document-badge { background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}); color: white; padding: 18px 25px; border-radius: 10px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .document-title { font-size: 14px; font-weight: bold; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px; }
    .document-subtitle { font-size: 11px; opacity: 0.9; margin-bottom: 4px; }
    .document-number { font-size: 16px; font-weight: bold; }
    
    .info-summary { background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid ${primaryColor}; }
    .info-summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .info-summary-item { font-size: 11px; }
    .info-summary-label { font-weight: 600; color: #475569; display: inline; }
    .info-summary-value { color: #1e293b; display: inline; }
    
    .section-title { background: linear-gradient(90deg, ${primaryColor}, ${secondaryColor}); color: white; padding: 12px 16px; border-radius: 6px; font-size: 13px; font-weight: bold; margin: 24px 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    
    .inspection-headers { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .inspection-header-box { padding: 14px; border-radius: 8px; text-align: center; }
    .delivery-box { background: ${primaryColor}; color: white; }
    .return-box { background: ${secondaryColor}; color: white; }
    .inspection-header-title { font-size: 13px; font-weight: bold; margin-bottom: 12px; }
    
    .annex-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
    .annex-info-item { font-size: 10px; }
    .annex-info-label { font-weight: 600; color: #334155; }
    .annex-info-value { color: #1e293b; }
    .annex-notes-section { margin-top: 10px; padding: 10px; background: #f1f5f9; border-radius: 4px; }
    .annex-notes-title { font-size: 10px; font-weight: bold; color: #475569; margin-bottom: 4px; }
    .annex-notes-text { font-size: 10px; color: #64748b; line-height: 1.5; }
    
    .photo-comparison-row { margin-bottom: 24px; page-break-inside: avoid; }
    .photo-label-row { background: #334155; color: white; padding: 8px 16px; border-radius: 6px 6px 0 0; font-size: 12px; font-weight: bold; text-align: center; }
    .photos-grid-large { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 3px solid #334155; border-top: none; border-radius: 0 0 6px 6px; overflow: hidden; }
    .photo-large-container { position: relative; background: #f8fafc; min-height: 300px; display: flex; align-items: center; justify-content: center; border-right: 2px solid #334155; }
    .photo-large-container:last-child { border-right: none; }
    .photo-large-container img { width: 100%; height: auto; display: block; max-height: 400px; object-fit: contain; padding: 10px; }
    .no-photo-large { padding: 80px 20px; text-align: center; font-size: 12px; color: #94a3b8; font-weight: 500; }
    
    .footer { text-align: center; padding-top: 25px; margin-top: 30px; border-top: 3px solid ${primaryColor}; color: #64748b; font-size: 10px; }
    .footer-brand { color: ${primaryColor}; font-weight: bold; font-size: 12px; margin-bottom: 8px; }
    
    @media print { 
      body { padding: 10px; } 
      .page-break { page-break-before: always; }
      .photo-comparison-row { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-section">${logoHtml}</div>
      <div class="document-badge">
        <div class="document-title">ANEXO DE INSPECCIONES</div>
        <div class="document-subtitle">Comparativa Fotográfica Detallada</div>
        <div class="document-number">${data.contractNumber}</div>
      </div>
    </div>
    
    <div class="info-summary">
      <div class="info-summary-grid">
        <div class="info-summary-item">
          <span class="info-summary-label">Cliente:</span>
          <span class="info-summary-value">${data.customerFullname}</span>
        </div>
        <div class="info-summary-item">
          <span class="info-summary-label">Nº Reserva:</span>
          <span class="info-summary-value">${data.bookingNumber}</span>
        </div>
        <div class="info-summary-item">
          <span class="info-summary-label">Vehículo:</span>
          <span class="info-summary-value">${data.vehicleMake} ${data.vehicleModel}</span>
        </div>
        <div class="info-summary-item">
          <span class="info-summary-label">Matrícula:</span>
          <span class="info-summary-value">${data.vehicleRegistration}</span>
        </div>
      </div>
    </div>
    
    <div class="section-title">${t.inspectionComparison}</div>
    
    <div class="inspection-headers">
      <div class="inspection-header-box delivery-box">
        <div class="inspection-header-title">${t.deliveryInspection}</div>
        ${generateInspectionInfo(data.deliveryInspection, true)}
      </div>
      <div class="inspection-header-box return-box">
        <div class="inspection-header-title">${t.returnInspection}</div>
        ${generateInspectionInfo(data.returnInspection, false)}
      </div>
    </div>
    
    <div class="section-title">Comparativa Fotográfica (Tamaño Grande)</div>
    
    ${generatePhotoRow(
      lang === 'es' ? 'Vista Frontal' : 'Front View',
      data.deliveryInspection?.frontPhoto,
      data.returnInspection?.frontPhoto
    )}
    
    ${generatePhotoRow(
      lang === 'es' ? 'Vista Lateral Izquierda' : 'Left Side View',
      data.deliveryInspection?.leftPhoto,
      data.returnInspection?.leftPhoto
    )}
    
    ${generatePhotoRow(
      lang === 'es' ? 'Vista Trasera' : 'Rear View',
      data.deliveryInspection?.rearPhoto,
      data.returnInspection?.rearPhoto
    )}
    
    ${generatePhotoRow(
      lang === 'es' ? 'Vista Lateral Derecha' : 'Right Side View',
      data.deliveryInspection?.rightPhoto,
      data.returnInspection?.rightPhoto
    )}
    
    ${generatePhotoRow(
      lang === 'es' ? 'Odómetro' : 'Odometer',
      data.deliveryInspection?.odometerPhoto,
      data.returnInspection?.odometerPhoto
    )}
    
    <div class="footer">
      <div class="footer-brand">${data.companyName || 'RENTAL COMPANY'}</div>
      Este documento es un anexo al contrato ${data.contractNumber} y forma parte del mismo.<br>
      Las fotografías tienen valor probatorio sobre el estado del vehículo en el momento de cada inspección.
    </div>
  </div>
</body>
</html>`;
  
  return html;
}

// Exportar función principal
export function generateInspectionAnnex(data: InspectionAnnexData): string {
  return generateInspectionAnnexHTML(data);
}
