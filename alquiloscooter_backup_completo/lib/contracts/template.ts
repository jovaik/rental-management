// Plantilla del contrato de alquiler en formato HTML moderno con multiidioma
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

interface VehicleInfo {
  registration: string;
  make: string;
  model: string;
  pricePerDay: number;
  days: number;
  total: number;
  deliveryInspection?: InspectionData;
  returnInspection?: InspectionData;
}

interface Driver {
  fullName: string;
  license?: string;
}

interface ExtraUpgrade {
  description: string;
  priceUnit: number;
  quantity: number;
  total: number;
}

interface ContractChange {
  version: number;
  date: string;
  reason: string;
  modifiedBy: string;
}

interface ContractData {
  contractNumber: string;
  contractDate: string;
  customerFullname: string;
  customerDni: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  driverLicense: string;
  
  // Múltiples vehículos
  vehicles: VehicleInfo[];
  
  // Conductores adicionales
  additionalDrivers?: Driver[];
  
  // Extras y upgrades
  extras?: ExtraUpgrade[];
  upgrades?: ExtraUpgrade[];
  
  pickupDate: string;
  returnDate: string;
  pickupLocation?: string;
  returnLocation?: string;
  
  // Precios desglosados
  subtotal: number;
  iva: number;
  totalPrice: string;
  
  // Comentarios especiales
  comments?: string;
  
  signatureDate?: string;
  signatureTime?: string;
  signatureData?: string; // ✅ NUEVO: Firma digital en Base64
  ipAddress?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoBase64?: string | null;
  companyName?: string;
  
  // Idioma del contrato
  language?: ContractLanguage;
  
  // Inspección de salida (TEMPORAL - será por vehículo en futuro)
  deliveryInspection?: InspectionData;
  
  // Inspección de devolución (TEMPORAL - será por vehículo en futuro)
  returnInspection?: InspectionData;
  
  // Historial de cambios (addenda)
  contractChanges?: ContractChange[];
  currentVersion?: number;
  
  // Enlace público para ver fotos de inspección
  inspectionLink?: string;
}

export function generateContractHTML(data: ContractData): string {
  // Obtener traducciones según el idioma
  const lang = data.language || 'es';
  const t = getTranslations(lang);
  
  // Colores corporativos
  const primaryColor = data.primaryColor || '#FF6B35';
  const secondaryColor = data.secondaryColor || '#FF8C42';
  
  // Logo HTML
  const logoHtml = data.logoBase64
    ? `<img src="${data.logoBase64}" alt="${data.companyName || 'Alquilo Scooter'}" class="logo-image">`
    : `<div class="logo-text">${data.companyName || 'Alquilo Scooter'}</div>`;
  
  // Generar sección de conductores adicionales (SIN vincular a vehículos específicos)
  let additionalDriversSection = '';
  if (data.additionalDrivers && data.additionalDrivers.length > 0) {
    additionalDriversSection = `
      <div class="section-title">${t.additionalDrivers}</div>
      <div class="conditions-list">
        ${data.additionalDrivers.map((driver, index) => `
          <div class="condition-item">
            <strong>${driver.fullName}</strong>
            ${driver.license ? ` - ${t.license}: ${driver.license}` : ''}
          </div>
        `).join('')}
      </div>
      <div class="warning-box">
        <p style="font-size: 8px; line-height: 1.3; margin-top: 3px;">
          ${lang === 'es' 
            ? 'El titular del contrato es el único responsable legal frente a la empresa de alquiler. Los conductores adicionales están autorizados para conducir cualquiera de los vehículos listados en este contrato, siempre que tengan licencia de conducción para el vehículo utilizado y no tendrán vinculación específica a un vehículo concreto.'
            : 'The contract holder is the sole legal responsible party before the rental company. Additional drivers are authorized to drive any of the vehicles listed in this contract, provided they have a valid driving license for the vehicle being used, and will not have specific assignment to any particular vehicle.'}
        </p>
      </div>
    `;
  }
  
  // ❌ DESACTIVADO: Historial de cambios/addenda 
  // Esta sección estaba generando 2+ hojas en blanco innecesarias
  // y mostrando "cambios" que el usuario no hizo explícitamente
  let addendaSection = '';
  
  // Generar filas de la tabla de vehículos
  const vehiclesTableRows = data.vehicles.map(vehicle => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 6px; font-size: 9px;">${vehicle.make} ${vehicle.model}</td>
      <td style="padding: 6px; text-align: center; font-size: 9px;">${vehicle.pricePerDay.toFixed(2)}€</td>
      <td style="padding: 6px; text-align: center; font-size: 9px;">${vehicle.days}</td>
      <td style="padding: 6px; text-align: right; font-size: 9px; font-weight: 600;">${vehicle.total.toFixed(2)}€</td>
    </tr>
  `).join('');
  
  // Generar filas de extras
  let extrasTableRows = '';
  if (data.extras && data.extras.length > 0) {
    extrasTableRows = data.extras.map(extra => `
      <tr style="border-bottom: 1px solid #e2e8f0; background: #fef3c7;">
        <td style="padding: 6px; font-size: 9px;">🎯 ${extra.description}</td>
        <td style="padding: 6px; text-align: center; font-size: 9px;">${extra.priceUnit.toFixed(2)}€</td>
        <td style="padding: 6px; text-align: center; font-size: 9px;">${extra.quantity}</td>
        <td style="padding: 6px; text-align: right; font-size: 9px; font-weight: 600;">${extra.total.toFixed(2)}€</td>
      </tr>
    `).join('');
  }
  
  // Generar filas de upgrades
  let upgradesTableRows = '';
  if (data.upgrades && data.upgrades.length > 0) {
    upgradesTableRows = data.upgrades.map(upgrade => `
      <tr style="border-bottom: 1px solid #e2e8f0; background: #dbeafe;">
        <td style="padding: 6px; font-size: 9px;">⭐ ${upgrade.description}</td>
        <td style="padding: 6px; text-align: center; font-size: 9px;">${upgrade.priceUnit.toFixed(2)}€</td>
        <td style="padding: 6px; text-align: center; font-size: 9px;">${upgrade.quantity}</td>
        <td style="padding: 6px; text-align: right; font-size: 9px; font-weight: 600;">${upgrade.total.toFixed(2)}€</td>
      </tr>
    `).join('');
  }
  
  // Generar filas de información de vehículos
  const vehiclesInfoRows = data.vehicles.map(vehicle => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 6px; font-size: 9px;">${vehicle.make} ${vehicle.model}</td>
      <td style="padding: 6px; text-align: center; font-weight: 600; font-size: 9px;">${vehicle.registration}</td>
      <td style="padding: 6px; text-align: center; font-size: 9px;">${vehicle.days} ${t.days}</td>
    </tr>
  `).join('');
  
  // Generar sección de comentarios
  let commentsSection = '';
  if (data.comments) {
    commentsSection = `
      <div class="warning-box">
        <div class="warning-box-title">${t.specialComments}</div>
        <p style="font-size: 8px; line-height: 1.3; margin-top: 3px;">${data.comments}</p>
      </div>
    `;
  }
  
  // Generar sección de enlace a inspección (SIN FOTOS)
  let deliveryInspectionSection = '';
  
  if (data.inspectionLink) {
    deliveryInspectionSection = `
      <div class="page-break"></div>
      <div class="inspection-link-section" style="margin-top: 30px; padding: 32px; background: linear-gradient(135deg, #fff5f0 0%, #ffffff 100%); border: 3px solid ${primaryColor}; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 40px; margin-bottom: 12px;">📸</div>
          <div class="section-title" style="font-size: 18px; font-weight: 700; color: ${primaryColor}; margin-bottom: 8px;">
            ${t.inspectionPhotos || (lang === 'es' ? 'FOTOGRAFÍAS DE INSPECCIÓN' : 'INSPECTION PHOTOS')}
          </div>
          <div style="width: 80px; height: 3px; background-color: ${primaryColor}; margin: 0 auto;"></div>
        </div>
        
        <div style="text-align: center;">
          <p style="font-size: 13px; margin-bottom: 16px; color: #334155; font-weight: 500;">
            ${lang === 'es' 
              ? '🔗 Las fotografías de la inspección de su vehículo están disponibles en línea'
              : '🔗 The inspection photos of your vehicle are available online'
            }
          </p>
          
          <div style="background: linear-gradient(135deg, ${primaryColor} 0%, #ff8c5a 100%); padding: 24px; border-radius: 10px; margin: 20px 0; box-shadow: 0 6px 16px rgba(255,107,53,0.3);">
            <p style="font-size: 12px; margin-bottom: 12px; color: white; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
              ${lang === 'es' ? '👇 ACCEDA AQUÍ 👇' : '👇 ACCESS HERE 👇'}
            </p>
            <a href="${data.inspectionLink}" 
               style="color: white; font-size: 14px; text-decoration: underline; font-weight: 700; word-break: break-all; line-height: 1.6;">
              ${data.inspectionLink}
            </a>
          </div>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin-top: 16px;">
            <p style="font-size: 11px; color: #92400e; margin: 0; font-weight: 600;">
              ⏰ ${lang === 'es' 
                ? 'Enlace válido durante 30 días desde la fecha del contrato'
                : 'Link valid for 30 days from contract date'
              }
            </p>
          </div>
        </div>
      </div>
    `;
  }
  // Construir el HTML completo
  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${t.rentalContract} ${data.contractNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    /* Control de orphans y widows para evitar líneas huérfanas */
    body, p, li, div { 
      orphans: 3; 
      widows: 3; 
    }
    
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      background: white; 
      padding: 6px; 
      color: #1e293b; 
      line-height: 1.25; 
      font-size: 9px; 
    }
    
    .container { max-width: 800px; margin: 0 auto; }
    
    /* HEADER - Reducido */
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      margin-bottom: 6px; 
      padding-bottom: 5px; 
      border-bottom: 2px solid ${primaryColor}; 
    }
    .logo-section { flex: 1; }
    .logo-image { max-width: 300px; max-height: 70px; width: auto; height: auto; object-fit: contain; }
    .logo-text { font-size: 22px; font-weight: bold; color: ${primaryColor}; }
    .company-tagline { font-size: 8px; color: #64748b; font-style: italic; }
    .document-badge { 
      background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}); 
      color: white; 
      padding: 6px 10px; 
      border-radius: 4px; 
      text-align: center; 
    }
    .document-title { font-size: 10px; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; }
    .document-number { font-size: 12px; font-weight: bold; margin-bottom: 1px; }
    .document-date { font-size: 8px; opacity: 0.9; }
    
    /* INFO GRID - Más compacto */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 6px; }
    .info-card { background: #f8fafc; padding: 5px; border-radius: 3px; border-left: 2px solid ${primaryColor}; }
    .info-card-title { font-size: 7px; font-weight: bold; color: ${primaryColor}; margin-bottom: 3px; text-transform: uppercase; }
    .info-item { margin-bottom: 2px; font-size: 8px; }
    .info-label { font-weight: 600; color: #475569; display: inline-block; min-width: 70px; }
    .info-value { color: #1e293b; }
    
    /* SECTION TITLES - Más compactos */
    .section-title { 
      background: linear-gradient(90deg, ${primaryColor}, ${secondaryColor}); 
      color: white; 
      padding: 4px 8px; 
      border-radius: 3px; 
      font-size: 9px; 
      font-weight: bold; 
      margin: 6px 0 4px 0; 
      text-transform: uppercase; 
    }
    
    /* LISTAS Y CONDICIONES - Más compactas */
    .conditions-list { 
      background: white; 
      border: 1px solid #e2e8f0; 
      border-radius: 3px; 
      padding: 5px; 
      margin-bottom: 5px; 
    }
    .condition-item { 
      margin-bottom: 3px; 
      padding-left: 12px; 
      position: relative; 
      font-size: 8px; 
      line-height: 1.3; 
    }
    .condition-item:before { 
      content: "→"; 
      position: absolute; 
      left: 0; 
      color: ${primaryColor}; 
      font-weight: bold; 
      font-size: 9px; 
    }
    
    /* WARNING BOX - Más compacto */
    .warning-box { 
      background: #fef3c7; 
      border-left: 2px solid #f59e0b; 
      padding: 5px; 
      margin: 5px 0; 
      border-radius: 2px; 
      page-break-inside: avoid;
    }
    .warning-box-title { 
      font-weight: bold; 
      color: #92400e; 
      font-size: 8px; 
      margin-bottom: 3px; 
      text-transform: uppercase; 
    }
    
    /* ARTÍCULOS - Compactos con control de saltos */
    .article-section { 
      background: #f8fafc; 
      padding: 5px; 
      border-radius: 3px; 
      margin-bottom: 5px; 
      border: 1px solid #e2e8f0; 
      page-break-inside: avoid; 
    }
    .article-title { 
      color: ${primaryColor}; 
      font-size: 9px; 
      font-weight: bold; 
      margin-bottom: 3px; 
      padding-bottom: 2px; 
      border-bottom: 1px solid ${primaryColor}30; 
    }
    .article-content { 
      font-size: 8px; 
      color: #334155; 
      line-height: 1.3; 
    }
    .article-content p { 
      margin-bottom: 4px; 
    }
    .article-list { 
      list-style: upper-alpha; 
      padding-left: 14px; 
      margin-top: 3px; 
    }
    .article-list li { 
      margin-bottom: 2px; 
      padding-left: 2px; 
      font-size: 8px; 
      line-height: 1.3; 
    }
    
    /* FIRMA - Compacta */
    .signature-section { 
      background: linear-gradient(135deg, #f8fafc, #e2e8f0); 
      padding: 8px; 
      border-radius: 4px; 
      margin-top: 8px; 
      border: 2px solid ${primaryColor}30; 
      page-break-inside: avoid; 
    }
    .signature-title { 
      color: ${primaryColor}; 
      font-size: 10px; 
      font-weight: bold; 
      margin-bottom: 5px; 
      text-align: center; 
      text-transform: uppercase; 
    }
    .signature-declarations { 
      background: white; 
      padding: 5px; 
      border-radius: 3px; 
      margin-bottom: 5px; 
      border-left: 2px solid ${primaryColor}; 
    }
    .declaration-item { 
      margin-bottom: 3px; 
      font-size: 8px; 
      padding-left: 12px; 
      position: relative; 
    }
    .declaration-item:before { 
      content: "✓"; 
      position: absolute; 
      left: 0; 
      color: ${primaryColor}; 
      font-weight: bold; 
      font-size: 9px; 
    }
    .signature-info { 
      display: grid; 
      grid-template-columns: repeat(3, 1fr); 
      gap: 5px; 
      margin-top: 5px; 
      padding-top: 5px; 
      border-top: 1px dashed #cbd5e1; 
    }
    .signature-item { text-align: center; font-size: 7px; }
    .signature-label { font-weight: bold; color: #475569; margin-bottom: 1px; }
    .signature-value { color: ${primaryColor}; font-weight: 600; }
    
    /* FOOTER - Compacto */
    .footer { 
      text-align: center; 
      padding-top: 6px; 
      margin-top: 8px; 
      border-top: 1px solid ${primaryColor}; 
      color: #64748b; 
      font-size: 7px; 
    }
    .footer-brand { 
      color: ${primaryColor}; 
      font-weight: bold; 
      font-size: 9px; 
      margin-bottom: 2px; 
    }
    
    /* COMPARATIVA DE INSPECCIONES - Ultra compacto */
    .inspection-comparison-section { 
      background: #f8fafc; 
      padding: 5px; 
      border-radius: 3px; 
      margin-top: 6px; 
      border: 2px solid ${primaryColor}; 
      page-break-inside: avoid;
    }
    .vehicle-title {
      text-align: center; 
      font-size: 11px; 
      font-weight: bold; 
      color: ${primaryColor}; 
      margin-bottom: 8px;
    }
    .comparison-grid { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 5px; 
      margin-top: 4px; 
      margin-bottom: 4px; 
    }
    .comparison-column { 
      background: white; 
      border-radius: 3px; 
      padding: 4px; 
      border: 1px solid #e2e8f0; 
    }
    .comparison-header { 
      font-size: 9px; 
      font-weight: bold; 
      padding: 4px 6px; 
      border-radius: 3px; 
      margin-bottom: 5px; 
      text-align: center; 
      color: white; 
    }
    .delivery-header { background: ${primaryColor}; }
    .return-header { background: ${secondaryColor}; }
    .comparison-info { font-size: 8px; }
    .comparison-photos-grid { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 6px; 
      margin-top: 6px; 
    }
    .comparison-photos-column { 
      display: flex; 
      flex-direction: column; 
      gap: 4px; 
    }
    .comparison-photo-item { 
      border: 1px solid #e2e8f0; 
      border-radius: 2px; 
      overflow: hidden; 
      background: white; 
    }
    .comparison-photo-item img { 
      width: 100%; 
      height: auto; 
      display: block; 
      max-height: 70px; 
      object-fit: contain; 
      background: #f8fafc; 
    }
    .comparison-photo-label { 
      background: #64748b; 
      color: white; 
      padding: 2px; 
      text-align: center; 
      font-size: 7px; 
      font-weight: bold; 
    }
    .no-photo { 
      background: #f1f5f9; 
      padding: 15px 5px; 
      text-align: center; 
      font-size: 7px; 
      color: #94a3b8; 
    }
    .empty-inspection { 
      background: #fef3c7; 
      padding: 8px; 
      text-align: center; 
      font-size: 8px; 
      color: #92400e; 
      border-radius: 3px; 
    }
    
    @media print { 
      body { padding: 6px; } 
      .page-break { page-break-before: always; } 
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-section">${logoHtml}</div>
      <div class="document-badge"><div class="document-title">${t.rentalContract}</div><div class="document-number">${data.contractNumber}</div></div>
    </div>
    
    <div class="info-grid">
      <div class="info-card">
        <div class="info-card-title">${t.customerData}</div>
        <div class="info-item"><span class="info-label">${t.name}:</span><span class="info-value">${data.customerFullname}</span></div>
        <div class="info-item"><span class="info-label">${t.dniNie}:</span><span class="info-value">${data.customerDni || 'N/A'}</span></div>
        <div class="info-item"><span class="info-label">${t.phone}:</span><span class="info-value">${data.customerPhone}</span></div>
        <div class="info-item"><span class="info-label">${t.email}:</span><span class="info-value">${data.customerEmail || 'N/A'}</span></div>
        <div class="info-item"><span class="info-label">${t.address}:</span><span class="info-value">${data.customerAddress || 'N/A'}</span></div>
        <div class="info-item"><span class="info-label">${t.license}:</span><span class="info-value">${data.driverLicense || 'N/A'}</span></div>
      </div>
      
      <div class="info-card">
        <div class="info-card-title">${t.bookingData}</div>
        <div class="info-item"><span class="info-label">${t.pickup}:</span><span class="info-value">${data.pickupDate}</span></div>
        <div class="info-item"><span class="info-label">${t.location}:</span><span class="info-value">${data.pickupLocation || 'N/A'}</span></div>
        <div class="info-item" style="margin-top: 5px;"><span class="info-label">${t.return}:</span><span class="info-value">${data.returnDate}</span></div>
        <div class="info-item"><span class="info-label">${t.location}:</span><span class="info-value">${data.returnLocation || 'N/A'}</span></div>
      </div>
    </div>

    ${additionalDriversSection}

    <div class="section-title">${t.priceBreakdown}</div>
    <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 3px; overflow: hidden; margin-bottom: 8px;">
      <thead>
        <tr style="background: ${primaryColor}; color: white;">
          <th style="padding: 5px; text-align: left; font-size: 8px;">${t.description}</th>
          <th style="padding: 5px; text-align: center; font-size: 8px; width: 80px;">${t.unitPrice}</th>
          <th style="padding: 5px; text-align: center; font-size: 8px; width: 60px;">${t.quantity}</th>
          <th style="padding: 5px; text-align: right; font-size: 8px; width: 80px;">${t.total}</th>
        </tr>
      </thead>
      <tbody>
        ${vehiclesTableRows}
        ${extrasTableRows}
        ${upgradesTableRows}
      </tbody>
      <tfoot>
        <tr style="background: #f8fafc; border-top: 1px solid ${primaryColor};">
          <td colspan="3" style="padding: 5px; text-align: right; font-weight: bold; font-size: 9px;">${t.subtotal}:</td>
          <td style="padding: 5px; text-align: right; font-weight: bold; font-size: 9px;">${data.subtotal.toFixed(2)}€</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td colspan="3" style="padding: 5px; text-align: right; font-size: 8px;">${t.iva}:</td>
          <td style="padding: 5px; text-align: right; font-size: 8px;">${data.iva.toFixed(2)}€</td>
        </tr>
        <tr style="background: ${primaryColor}; color: white;">
          <td colspan="3" style="padding: 6px; text-align: right; font-weight: bold; font-size: 10px;">${t.total.toUpperCase()}:</td>
          <td style="padding: 6px; text-align: right; font-weight: bold; font-size: 10px;">${data.totalPrice}€</td>
        </tr>
      </tfoot>
    </table>

    <div class="section-title">${t.vehiclesInfo}</div>
    <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 3px; overflow: hidden; margin-bottom: 8px; font-size: 8px;">
      <thead>
        <tr style="background: #f8fafc; border-bottom: 1px solid ${primaryColor};">
          <th style="padding: 5px; text-align: left;">${t.vehicle}</th>
          <th style="padding: 5px; text-align: center;">${t.registration}</th>
          <th style="padding: 5px; text-align: center;">${t.days}</th>
        </tr>
      </thead>
      <tbody>
        ${vehiclesInfoRows}
      </tbody>
    </table>

    ${commentsSection}

    <div class="section-title">${t.generalConditions}</div>
    <div class="conditions-list">
      <div class="condition-item">${t.conditions.rental}</div>
      <div class="condition-item">${t.conditions.helmet}</div>
      <div class="condition-item">${t.conditions.passengers}</div>
      <div class="condition-item">${t.conditions.theft}</div>
      <div class="condition-item">${t.conditions.returnDelay}</div>
      <div class="condition-item">${t.conditions.maritimeZone}</div>
    </div>
    
    <div class="warning-box">
      <div class="warning-box-title">${t.warnings.title}</div>
      <ul style="margin-left: 16px; font-size: 8px; line-height: 1.3;">
        <li style="margin-bottom: 2px;">${t.warnings.noObjects}</li>
        <li style="margin-bottom: 2px;">${t.warnings.mandatoryContract}</li>
        <li style="margin-bottom: 2px;">${t.warnings.helmetDamage}</li>
        <li style="margin-bottom: 2px;">${t.warnings.fuelReturn}</li>
        <li style="margin-bottom: 2px;">${t.warnings.cityLimits}</li>
        <li>${t.warnings.sanctions}</li>
      </ul>
    </div>

    <!-- Texto LOPD y presentación de la empresa -->
    <div style="background: white; padding: 6px; margin: 6px 0; border-radius: 2px; font-size: 8px; line-height: 1.3; color: #334155; page-break-inside: avoid;">
      <p style="margin-bottom: 4px;">De igual manera, en cumplimiento de lo dispuesto en la LOPD 15/99 y el RLOPD, le informamos que los datos personales voluntariamente facilitados por usted serán incluidos en los ficheros responsabilidad de GRUPO SERVYTUR (JOSE M.MILLAN FERNANDEZ), inscritos en el Registro General de Protección de Datos, cuya finalidad, es la de gestionar la comunicación al asegurador del uso del vehículo por usted arrendado y para fines de gestión administrativa, contable y comercial de la propia empresa, así como para el cumplimiento de cualquier obligación legal y el objeto social de la empresa. Con la firma del presente, usted presta su consentimiento expreso para que sus datos puedan ser cedidos a terceros directamente relacionados cuando ello sea necesario para cualquiera de las finalidades previstas en el párrafo anterior. Usted podrá solicitar gratuitamente el ejercicio de los derechos de acceso, rectificación, oposición y/o cancelación mediante email certificado a info@alquiloscooter.com adjuntando, en todo caso, prueba fehaciente de su identidad.</p>
      <p style="margin-top: 4px;"><strong>La empresa contratante, en adelante ALQUILOSCOOTER, alquila al CLIENTE cuyos datos y firma figuran en este contrato, el vehículo designado, de conformidad con las cláusulas y condiciones que se establecen y que el arrendatario acepta y se obliga a cumplir.</strong></p>
    </div>

    <div class="page-break"></div>

    <div class="section-title">TÉRMINOS Y CONDICIONES DEL CONTRATO DE ALQUILER</div>

    <div class="article-section">
      <div class="article-title">ARTÍCULO 1 - UTILIZACIÓN DEL VEHÍCULO</div>
      <div class="article-content">
        <p>El CLIENTE se compromete a no dejar conducir el vehículo por otras personas que las expresamente aceptadas por ALQUILOSCOOTER y, en todo caso, bajo la responsabilidad exclusiva y personal del CLIENTE. Asimismo, el CLIENTE se compromete a no conducir ni dejar conducir el vehículo:</p>
        <ul class="article-list">
          <li>Para el transporte de pasajeros o mercancías a título oneroso, cualquiera que sea el tipo de remuneración elegida y la forma, escrita o verbal, del acuerdo.</li>
          <li>Para empujar o remolcar cualquier vehículo o remolque o cualquier objeto, rodante o no.</li>
          <li>Para participar en competiciones deportivas o no.</li>
          <li>Por cualquier persona en estado de incapacidad para hacerlo de forma segura, ya sea por razón de alcohol, drogas, medicamentos, enfermedad, fatiga o cualquier otra circunstancia similar o análoga que disminuya su capacidad de conducción.</li>
          <li>Con fines ilícitos o para el transporte de mercancías prohibidas.</li>
          <li>Con sobrecarga, es decir, transportando más pasajeros de los permitidos o autorizados.</li>
          <li>Por personas distintas de las expresamente mencionadas y previamente autorizadas por el CLIENTE, siempre que dichas personas hayan alcanzado la edad de 23 años, sean titulares de un permiso de conducir válido desde hace al menos tres años y estén en posesión del mismo.</li>
          <li>Con negligencia, es decir, el CLIENTE se compromete a mantener el vehículo cerrado con llave, en buenas condiciones de seguridad y a conservar personalmente las llaves y los documentos, que no deben dejarse en el vehículo.</li>
          <li>Como propio, es decir, no puede ceder, vender, hipotecar o pignorar el presente contrato, el vehículo, su equipo o herramientas, ni tratarlos de manera que cause daño a ALQUILOSCOOTER.</li>
        </ul>
        <p style="margin-top: 5px;"><strong>Cualquier infracción de estas condiciones autoriza a ALQUILOSCOOTER a exigir del CLIENTE la devolución inmediata del vehículo, sin justificación ni compensación, y a no devolver al cliente el depósito abonado como penalización por incumplimiento del contrato.</strong></p>
      </div>
    </div>

    <div class="article-section">
      <div class="article-title">ARTÍCULO 2 - ESTADO DEL VEHÍCULO</div>
      <div class="article-content">
        <p style="margin-bottom: 4px;">El CLIENTE reconoce haber recibido el vehículo en perfecto estado de funcionamiento y limpieza, incluidos los neumáticos que, en caso de deterioro no debido al desgaste normal, deberán ser reemplazados de inmediato, a su cargo, por uno o varios otros de características idénticas, o abonar el importe y los daños causados al vehículo.</p>
        <p style="margin-bottom: 4px;">El CLIENTE no podrá en ningún caso manipular los contadores kilométricos u otros, ni sus tubos, y si lo hace, será responsable de los daños causados al vehículo.</p>
        <p style="margin-bottom: 4px;">Del mismo modo, el CLIENTE exonera a ALQUILOSCOOTER de toda responsabilidad por pérdida o daños causados a objetos dejados o transportados en el vehículo por el CLIENTE o por cualquier otra persona o sobre sus prendas de vestir, ya sea durante la vigencia del contrato o después de la devolución del vehículo. El CLIENTE defenderá y, en su caso, indemnizará a ALQUILOSCOOTER de cualquier reclamación basada en tales supuestos.</p>
        <p style="margin-bottom: 4px;"><strong>EL VEHÍCULO OBJETO DEL PRESENTE CONTRATO SE ENTREGA AL CLIENTE DEBIDAMENTE ETIQUETADO CON VINILOS DE IDENTIFICACIÓN QUE LLEVAN TANTO LA MARCA COMERCIAL ALQUILOSCOOTER COMO VINILOS DIFERENTES SEGÚN EL NÚMERO DE UNIDADES DE LA FLOTA CON EL TEXTO RENT A BIKE. LA MOTO DEBE DEVOLVERSE CON TODAS LAS PEGATINAS QUE LLEVABA EN EL MOMENTO DE SU ENTREGA AL CLIENTE. SI FALTA ALGUNA PEGATINA O SE INCLUYEN OTRAS, SE PERDERÁ LA FIANZA.</strong></p>
      </div>
    </div>

    <div class="article-section">
      <div class="article-title">ARTÍCULO 3 - PRECIO DE ALQUILER, FIANZA Y PRÓRROGA</div>
      <div class="article-content">
        <p style="margin-bottom: 4px;">El precio del alquiler así como la reserva vendrán determinados por las tarifas vigentes. El depósito no puede, en ningún caso, utilizarse para prorrogar el período de alquiler. En el caso de que el CLIENTE deseara conservar el vehículo más tiempo del previsto, deberá obtener la autorización por escrito de ALQUILOSCOOTER, a quien deberá abonar la cantidad correspondiente, bajo pena de ser objeto de reclamación por apropiación indebida o similar.</p>
        <p style="margin-bottom: 4px;">El CLIENTE se compromete a devolver el vehículo a ALQUILOSCOOTER en la fecha prevista en el contrato de alquiler. Sólo la devolución del vehículo a ALQUILOSCOOTER en el lugar y fecha convenidos en el contrato de alquiler pone fin al contrato.</p>
        <p style="margin-bottom: 4px;"><strong>EL CLIENTE AUTORIZA LAS PRÓRROGAS DE CONTRATO QUE HAYA SOLICITADO. EL RETRASO EN LA DEVOLUCIÓN DEL VEHÍCULO DE MÁS DE 30 MINUTOS AUTORIZA A ALQUILOSCOOTER A COBRAR UN SUPLEMENTO DE UN DÍA DE LA TARIFA NORMAL DEL VEHÍCULO.</strong></p>
        <p style="margin-bottom: 4px;"><strong>EL EXCESO DE 24H DEL DÍA FIJADO PARA LA DEVOLUCIÓN DEL VEHÍCULO IMPLICARÁ LA PÉRDIDA DE LA FIANZA Y ALQUILOSCOOTER PODRÁ RETIRARLA SI ASÍ LO CONSTATA ASÍ COMO COMENZAR LAS ACCIONES LEGALES Y POLICIALES APROPIADAS DIRIGIDAS A LA RECUPERACIÓN DEL VEHÍCULO. TODOS LOS DÍAS QUE TRANSCURRAN HASTA LA RECUPERACIÓN DEL VEHÍCULO SE FACTURARÁN AL CLIENTE A LA TARIFA DIARIA NORMAL.</strong></p>
        <p style="margin-bottom: 4px;">La devolución del vehículo por parte del CLIENTE antes del final del período inicialmente contratado no supone el reembolso de ninguna de las cantidades pagadas por el CLIENTE por el alquiler.</p>
        <p><strong>El incumplimiento por parte del CLIENTE del plazo contractual en los contratos de larga duración conlleva la pérdida inmediata del depósito, la anulación del contrato y la aplicación de la tarifa diaria normal.</strong></p>
      </div>
    </div>

    <div class="article-section">
      <div class="article-title">ARTÍCULO 4 - PAGOS</div>
      <div class="article-content">
        <p style="margin-bottom: 4px;">El CLIENTE está obligado a pagar a ALQUILOSCOOTER:</p>
        <ul class="article-list">
          <li>Los importes correspondientes, según tarifa, a la duración del alquiler.</li>
          <li>El importe de 60€ por servicio entre diferentes ciudades si así fuera o si el vehículo se deja en una de las bases de ALQUILOSCOOTER distinta de la proporcionada, sin el consentimiento por escrito de ALQUILOSCOOTER.</li>
          <li>Todos los impuestos, tasas y contribuciones, directas o indirectas, recaudadas sobre los importes mencionados anteriormente.</li>
          <li>Las multas, gastos, desembolsos y tasas por cualquier infracción de la legislación relativa a la circulación, conducción, estacionamiento y otros correspondientes al vehículo, al CLIENTE o a ALQUILOSCOOTER durante la vigencia del presente contrato, salvo infracciones imputables a ALQUILOSCOOTER.</li>
          <li>Los desembolsos a realizar por ALQUILOSCOOTER para obtener del CLIENTE los pagos debidos en virtud del presente contrato, judiciales y extrajudiciales. El pago debe realizarse al finalizar el presente contrato o en un plazo de 24 horas y, de no ser así, el importe debido se incrementará en un 15% en concepto de penalización.</li>
          <li>Los gastos que asuma ALQUILOSCOOTER para la reparación de los daños causados por colisión u otras razones, salvo que el CLIENTE haya actuado con diligencia y que el responsable de la colisión sea un tercero, en cuyo caso debe haber un compromiso por escrito de la empresa contraria de reparar el vehículo dañado para cubrir la totalidad de la reparación.</li>
          <li>Los gastos que ALQUILOSCOOTER deba asumir para reparar los daños causados al vehículo por cualquier otra razón.</li>
        </ul>
        <p style="margin-top: 5px;">El CLIENTE no puede invocar una exención total o parcial de responsabilidad con el fin de retrasar el pago o negarse a pagar las sumas debidas a ALQUILOSCOOTER.</p>
        <p style="margin-top: 4px;">En el momento de la firma del contrato, el CLIENTE puede verse obligado a depositar una fianza para garantizar la devolución del vehículo al finalizar el contrato de alquiler en perfecto estado, sin ningún daño de cualquier naturaleza, y para responder de su pérdida o robo. Esta fianza cubre también el valor del vehículo en caso de pérdida.</p>
        <p style="margin-top: 4px;"><strong>La pérdida del depósito de garantía por daños, pérdida, robo y/o accidente se entiende sin perjuicio y a cargo de las eventuales responsabilidades posteriores del cliente final, en la medida en que éstas superen el depósito de garantía. A estos solos efectos, los vehículos se valoran en 2.500€. Esta fianza se liquidará al finalizar el contrato, y se devolverá o no, según el caso.</strong></p>
      </div>
    </div>

    <div class="article-section">
      <div class="article-title">ARTÍCULO 5 - SEGURO, GARANTÍAS Y COBERTURAS</div>
      <div class="article-content">
        <p style="margin-bottom: 4px;">Solo los conductores expresamente aceptados por ALQUILOSCOOTER tienen la condición de asegurados. El CLIENTE y todo conductor del vehículo autorizado conforme al artículo 1 participan como asegurados en una póliza de seguro de automóvil cuya copia está a disposición del CLIENTE en el domicilio social de ALQUILOSCOOTER.</p>
        <p style="margin-bottom: 4px;">Dicha póliza cubre la responsabilidad civil y los daños causados a terceros conforme a la legislación vigente en el país de matriculación del vehículo. El CLIENTE declara su acuerdo con dicha póliza y se compromete a respetar las condiciones y cláusulas de la misma.</p>
        <p style="margin-bottom: 4px;">Además, se compromete a tomar todas las medidas necesarias para proteger los intereses de ALQUILOSCOOTER y de la compañía de seguros en caso de accidente, y especialmente a:</p>
        <ul class="article-list">
          <li>Informar a ALQUILOSCOOTER dentro de las 24 horas siguientes a cualquier accidente, robo, incendio, daño, así como a la policía de cualquier daño o robo.</li>
          <li>Mencionar en su declaración las circunstancias, el lugar, la fecha, la hora del accidente, el nombre y la dirección de los testigos, el nombre y la dirección del propietario del vehículo contrario, la matrícula del mismo, así como la compañía de seguros y el número de póliza.</li>
          <li>Adjuntar a esta declaración cualquier informe de la policía, Guardia Civil o tribunal si procede.</li>
          <li>No rebatir en ninguna circunstancia la responsabilidad ni transigir con terceros sobre el accidente.</li>
          <li>No abandonar el vehículo accidentado sin tomar las medidas apropiadas para protegerlo y salvaguardarlo.</li>
        </ul>
        <p style="margin-top: 5px;">El seguro contratado incluye las garantías y coberturas siguientes, conforme a lo dispuesto en la póliza suscrita con SEGUROS CASER:</p>
        <ul class="article-list">
          <li>Seguro de responsabilidad civil obligatorio, cubriendo lo establecido por la ley en cuanto a lesiones y daños causados a terceros por el vehículo asegurado.</li>
          <li>Responsabilidad civil de suscripción voluntaria hasta 50 millones de euros.</li>
          <li>Protección jurídica y reclamaciones de daños, cubriendo, con las limitaciones establecidas en las Condiciones Generales, la asistencia jurídica, judicial y extrajudicial así como el pago de los gastos ocasionados para la defensa jurídica del asegurado en los procedimientos administrativos, judiciales y arbitrales derivados de un accidente de circulación con el vehículo asegurado.</li>
          <li>Seguro del conductor, cubriendo las indemnizaciones por fallecimiento y la asistencia médica del conductor autorizado y legalmente habilitado, como consecuencia de un accidente de circulación del vehículo asegurado. Las sumas aseguradas en caso de fallecimiento e invalidez son respectivamente de 18.000€ y 18.000€.</li>
          <li>Asistencia en viaje en un radio máximo de 20 km desde la sede de ALQUILOSCOOTER. Cualquier asistencia más allá de este radio será abonada por el cliente. La garantía no cubre ni las prendas de vestir ni los objetos transportados.</li>
        </ul>
        <p style="margin-top: 5px;"><strong>El seguro es únicamente válido durante la duración del alquiler conforme al presente contrato. Pasado este período, y salvo prórroga expresamente aceptada, ALQUILOSCOOTER declina toda responsabilidad por accidentes o daños causados por el CLIENTE, del que éste es el único responsable.</strong></p>
        <p style="margin-top: 4px;">El seguro no cubre al conductor que no posea un permiso de conducir válido y en vigor, o que no esté en condiciones de conducir de forma segura. Cuando el conductor no esté en condiciones de conducir de manera óptima por la ingesta de alcohol, drogas, medicamentos, enfermedad u otra causa similar, el CLIENTE y el conductor son solidariamente responsables de los daños que pudiera sufrir ALQUILOSCOOTER.</p>
        <p style="margin-top: 4px;">Los daños sufridos por el vehículo por desniveles o mal estado de la carretera son imputables al CLIENTE. ALQUILOSCOOTER declina toda responsabilidad en caso de accidente con terceros o daños al vehículo causados por el CLIENTE durante el período en que, deliberadamente, proporciona a ALQUILOSCOOTER información inexacta sobre su domicilio o la validez de su permiso de conducir, y en este caso, el seguro no será válido y conllevará también la pérdida de la fianza.</p>
        <p style="margin-top: 4px;"><strong>En caso de siniestro, ALQUILOSCOOTER no devolverá la fianza abonada hasta que se haya establecido claramente la responsabilidad del siniestro o de los daños, y en caso de responsabilidad de un tercero, tampoco se devolverá la fianza hasta que no haya un compromiso firme y por escrito de la compañía contraria para la reparación total del vehículo siniestrado.</strong></p>
      </div>
    </div>

    <div class="article-section">
      <div class="article-title">ARTÍCULO 6 - ROBO</div>
      <div class="article-content">
        <p><strong>EL CLIENTE ES RESPONSABLE DEL ROBO O USURPACIÓN DEL VEHÍCULO Y DE LOS DAÑOS CAUSADOS AL VEHÍCULO COMO CONSECUENCIA DE DICHO ROBO O USURPACIÓN SALVO PARA CLIENTES CON TARIFA INCREMENTADA QUE LIMITAN LA RESPONSABILIDAD DEL CLIENTE POR LA MOTO AL IMPORTE DEPOSITADO COMO FIANZA.</strong></p>
        <p style="margin-top: 4px;"><strong>EL CLIENTE AUTORIZA A ALQUILOSCOOTER A DEBITAR EN SU TARJETA DE CRÉDITO EL IMPORTE NECESARIO PARA CUBRIR EL VALOR DEL VEHÍCULO, DEDUCIDO EL IMPORTE ENTREGADO COMO DEPÓSITO DE GARANTÍA, Y SE COMPROMETE EN TODO CASO A PAGAR EL VALOR TOTAL DEL VEHÍCULO.</strong></p>
      </div>
    </div>

    <div class="article-section">
      <div class="article-title">ARTÍCULO 7 - MANTENIMIENTO Y REPARACIONES</div>
      <div class="article-content">
        <p style="margin-bottom: 4px;">El desgaste mecánico debido al uso normal del vehículo y su mantenimiento efectuado a tiempo serán asumidos por ALQUILOSCOOTER. En caso de inmovilización del vehículo, las reparaciones sólo pueden efectuarse previo acuerdo por escrito y según instrucciones de ALQUILOSCOOTER, que deben ser objeto de factura detallada. Las piezas defectuosas reemplazadas deben presentarse con la factura.</p>
        <p style="margin-bottom: 4px;">El CLIENTE no puede en ningún caso reclamar daños y perjuicios por retraso en la entrega del vehículo, anulación del alquiler o inmovilización debida a reparaciones efectuadas durante el alquiler. El CLIENTE no es responsable en caso de daños corporales o materiales causados por defectos de fabricación o reparaciones anteriores.</p>
        <p><strong>El CLIENTE está obligado a respetar el mantenimiento previsto por ALQUILOSCOOTER y a llevar el vehículo a los talleres autorizados por ALQUILOSCOOTER para las inspecciones y el mantenimiento. Para alquileres de larga duración, estos controles deben realizarse OBLIGATORIAMENTE cada 3.000 km, de lo contrario la fianza se perderá inmediatamente y los gastos de reparación de cualquier índole serán a cargo del CLIENTE y no de ALQUILOSCOOTER.</strong></p>
      </div>
    </div>

    <div class="article-section">
      <div class="article-title">ARTÍCULO 8 - CARBURANTE Y ACEITE</div>
      <div class="article-content">
        <p style="margin-bottom: 4px;">El CLIENTE es responsable del carburante. El CLIENTE debe verificar permanentemente los niveles de agua y aceite así como la presión de los neumáticos. En el caso de que el CLIENTE deba poner aceite por bajo nivel de aceite (siempre con autorización previa de ALQUILOSCOOTER), debe presentar la factura correspondiente para obtener el reembolso del reemplazo del aceite.</p>
        <p><strong>CUALQUIER AVERÍA CAUSADA POR LA FALTA DE CONTROL DE ESTOS NIVELES SERÁ A CARGO DEL CLIENTE.</strong></p>
      </div>
    </div>

    <div class="article-section">
      <div class="article-title">ARTÍCULO 9 - RESPONSABILIDAD</div>
      <div class="article-content">
        <p style="margin-bottom: 4px;">El CLIENTE o cualquier conductor que utilice la moto durante la vigencia del presente contrato es penalmente responsable de las infracciones que cometa al conducir el vehículo y al estacionarlo, conforme al Código Penal, Código de Circulación y demás disposiciones legales vigentes.</p>
        <p><strong>EN CASO DE INFRACCIÓN DE TRÁFICO O ADMINISTRATIVA NOTIFICADA A ALQUILOSCOOTER TRAS LA FINALIZACIÓN DEL CONTRATO, EL CLIENTE AUTORIZA A ALQUILOSCOOTER A DEBITAR EL IMPORTE DE LA INFRACCIÓN O LA SANCIÓN EN SU TARJETA DE CRÉDITO Y SE COMPROMETE, EN TODOS LOS CASOS, A PAGARLA.</strong></p>
      </div>
    </div>

    <div class="article-section">
      <div class="article-title">ARTÍCULO 10 - VALIDEZ DEL CONTRATO</div>
      <div class="article-content">
        <p>Cualquier modificación de los términos y condiciones del presente contrato debe estipularse expresamente por escrito, de lo contrario será nula y sin efecto.</p>
      </div>
    </div>

    <div class="article-section">
      <div class="article-title">ARTÍCULO 11 - LEGISLACIÓN APLICABLE</div>
      <div class="article-content">
        <p style="margin-bottom: 4px;">El presente contrato se rige e interpreta conforme a la legislación del país en el que fue firmado, cuyos juzgados y tribunales serán competentes para conocer de los litigios que pudieran derivarse del mismo, renunciando el CLIENTE a cualquier jurisdicción que pudiera corresponderle.</p>
        <p><strong>Cualquier cuestión derivada del presente contrato entre el CLIENTE y ALQUILOSCOOTER se someterá a la jurisdicción de los Juzgados y Tribunales de Málaga.</strong></p>
      </div>
    </div>

    <div class="signature-section">
      <div class="signature-title">${t.signature}</div>
      <div class="signature-declarations">
        <div class="declaration-item">${t.signatureDeclarations.read}</div>
        <div class="declaration-item">${t.signatureDeclarations.agree}</div>
        <div class="declaration-item">${t.signatureDeclarations.truthful}</div>
        <div class="declaration-item">${t.signatureDeclarations.license}</div>
        <div class="declaration-item">${t.signatureDeclarations.responsibility}</div>
        <div class="declaration-item">${t.signatureDeclarations.charges}</div>
      </div>
      <div class="signature-info">
        <div class="signature-item"><div class="signature-label">${t.signatureInfo.date}</div><div class="signature-value">${data.signatureDate || new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US')}</div></div>
        <div class="signature-item"><div class="signature-label">${t.signatureInfo.time}</div><div class="signature-value">${data.signatureTime || new Date().toLocaleTimeString(lang === 'es' ? 'es-ES' : 'en-US')}</div></div>
        <div class="signature-item"><div class="signature-label">${t.signatureInfo.ip}</div><div class="signature-value">${data.ipAddress || 'N/A'}</div></div>
      </div>
      ${data.signatureData ? `
      <div style="margin-top: 30px; padding: 20px; border: 2px solid ${data.primaryColor || '#FF6B35'}; border-radius: 8px; background: #f8f8f8;">
        <h3 style="margin: 0 0 15px 0; color: ${data.primaryColor || '#FF6B35'}; font-size: 16px; font-weight: bold;">${t.signatureInfo.signature || 'FIRMA DIGITAL DEL CLIENTE'}</h3>
        <img src="${data.signatureData}" style="max-width: 100%; max-height: 200px; border: 1px solid #ddd; padding: 10px; background: white; display: block;" />
        <p style="margin: 10px 0 0 0; font-size: 11px; color: #666;">${t.signatureInfo.verifiedSignature || 'Firma digital verificada y capturada en el momento de la firma del contrato'}</p>
      </div>
      ` : ''}
    </div>

    ${addendaSection}

    <div class="footer">
      <div class="footer-brand">${data.companyName || 'Alquilo Scooter'}</div>
      <p>${t.footer}</p>
    </div>
    
    ${deliveryInspectionSection}
  </div>
</body>
</html>
`;
  
  return html;
}

// Mantener compatibilidad con código antiguo
export const CONTRACT_TEMPLATE = '';
export function generateContract(data: ContractData): string {
  return generateContractHTML(data);
}

// Exportar tipos
export type { ContractData, VehicleInfo, Driver, ExtraUpgrade, InspectionData };