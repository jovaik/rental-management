// Contrato legal SIMPLE (sin inspecciones ni fotos)
// Peso objetivo: 50-100 KB
import { ContractLanguage, getTranslations } from './translations';

interface Driver {
  fullName: string;
  license?: string;
}

interface VehicleInfo {
  registration: string;
  make: string;
  model: string;
  pricePerDay: number;
  days: number;
  total: number;
}

interface ExtraUpgrade {
  description: string;
  priceUnit: number;
  quantity: number;
  total: number;
}

interface SimpleContractData {
  contractNumber: string;
  contractDate: string;
  customerFullname: string;
  customerDni: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  driverLicense: string;
  
  // Vehículos
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
  
  // Precios
  subtotal: number;
  iva: number;
  totalPrice: string;
  
  // Comentarios
  comments?: string;
  
  // Firma
  signatureDate?: string;
  signatureTime?: string;
  ipAddress?: string;
  signatureData?: string; // Base64 de la firma
  
  // Branding
  primaryColor?: string;
  secondaryColor?: string;
  logoBase64?: string | null;
  companyName?: string;
  
  // Idioma
  language?: ContractLanguage;
}

export function generateSimpleContractHTML(data: SimpleContractData): string {
  const lang = data.language || 'es';
  const t = getTranslations(lang);
  
  const primaryColor = data.primaryColor || '#FF6B35';
  const secondaryColor = data.secondaryColor || '#FF8C42';
  
  const logoHtml = data.logoBase64
    ? `<img src="${data.logoBase64}" alt="${data.companyName || 'Alquilo Scooter'}" class="logo-image">`
    : `<div class="logo-text">${data.companyName || 'Alquilo Scooter'}</div>`;

  // Sección de conductores adicionales
  let additionalDriversSection = '';
  if (data.additionalDrivers && data.additionalDrivers.length > 0) {
    additionalDriversSection = `
      <div class="section-title">${t.additionalDrivers}</div>
      <div class="conditions-list">
        ${data.additionalDrivers.map((driver) => `
          <div class="condition-item">
            <strong>${driver.fullName}</strong>
            ${driver.license ? ` - ${t.license}: ${driver.license}` : ''}
          </div>
        `).join('')}
      </div>
      <div class="warning-box">
        <p style="font-size: 8px; line-height: 1.3; margin-top: 3px;">
          ${lang === 'es' 
            ? 'El titular del contrato es el único responsable legal frente a la empresa de alquiler. Los conductores adicionales están autorizados para conducir cualquiera de los vehículos listados en este contrato.'
            : 'The contract holder is the sole legal responsible party before the rental company. Additional drivers are authorized to drive any of the vehicles listed in this contract.'}
        </p>
      </div>
    `;
  }

  // Tabla de vehículos
  const vehiclesTableRows = data.vehicles.map(vehicle => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 6px; font-size: 9px;">${vehicle.make} ${vehicle.model}</td>
      <td style="padding: 6px; text-align: center; font-size: 9px;">${vehicle.pricePerDay.toFixed(2)}€</td>
      <td style="padding: 6px; text-align: center; font-size: 9px;">${vehicle.days}</td>
      <td style="padding: 6px; text-align: right; font-size: 9px; font-weight: 600;">${vehicle.total.toFixed(2)}€</td>
    </tr>
  `).join('');

  // Extras
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

  // Upgrades
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

  // Info de vehículos
  const vehiclesInfoRows = data.vehicles.map(vehicle => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 6px; font-size: 9px;">${vehicle.make} ${vehicle.model}</td>
      <td style="padding: 6px; text-align: center; font-weight: 600; font-size: 9px;">${vehicle.registration}</td>
      <td style="padding: 6px; text-align: center; font-size: 9px;">${vehicle.days} ${t.days}</td>
    </tr>
  `).join('');

  // Comentarios
  let commentsSection = '';
  if (data.comments) {
    commentsSection = `
      <div class="warning-box">
        <div class="warning-box-title">${t.specialComments}</div>
        <p style="font-size: 8px; line-height: 1.3; margin-top: 3px;">${data.comments}</p>
      </div>
    `;
  }

  // Sección de firma
  let signatureSection = '';
  if (data.signatureData) {
    signatureSection = `
      <div style="page-break-before: always; margin-top: 20px;">
        <div class="section-title">${t.signatureTitle}</div>
        <div style="text-align: center; margin: 20px 0;">
          <img src="${data.signatureData}" alt="Firma" style="max-width: 300px; border: 1px solid #ddd; padding: 10px;">
          <p style="font-size: 9px; margin-top: 10px;">
            <strong>${data.customerFullname}</strong><br>
            ${data.signatureDate} ${data.signatureTime || ''}<br>
            ${data.ipAddress ? `IP: ${data.ipAddress}` : ''}
          </p>
        </div>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.contractTitle} - ${data.contractNumber}</title>
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
      font-size: 9px;
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
      margin-bottom: 15px;
    }
    
    .section-title {
      background: ${primaryColor};
      color: white;
      padding: 8px 12px;
      font-size: 11px;
      font-weight: bold;
      margin: 12px 0 8px 0;
      border-radius: 4px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }
    
    .info-item {
      padding: 6px;
      background: #f7fafc;
      border-left: 3px solid ${primaryColor};
    }
    
    .info-label {
      font-size: 7px;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .info-value {
      font-size: 9px;
      font-weight: 600;
      color: #2d3748;
      margin-top: 2px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 9px;
    }
    
    th {
      background: ${secondaryColor};
      color: white;
      padding: 6px;
      text-align: left;
      font-size: 9px;
    }
    
    .warning-box {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 8px;
      margin: 10px 0;
    }
    
    .warning-box-title {
      font-weight: bold;
      font-size: 9px;
      margin-bottom: 5px;
    }
    
    .conditions-list {
      margin: 8px 0;
    }
    
    .condition-item {
      padding: 4px 0;
      font-size: 8px;
      line-height: 1.3;
    }
  </style>
</head>
<body>
  <div class="logo-container">
    ${logoHtml}
  </div>
  
  <div class="header">
    <div style="text-align: center; margin-bottom: 10px;">
      <div style="font-size: 16px; font-weight: bold; color: ${primaryColor};">${t.contractTitle}</div>
      <div style="font-size: 11px; color: #718096; margin-top: 5px;">${t.contractNumber}: ${data.contractNumber}</div>
      <div style="font-size: 9px; color: #718096; margin-top: 3px;">${t.contractDate}: ${data.contractDate}</div>
    </div>
  </div>

  <div class="section-title">${t.customerData}</div>
  <div class="info-grid">
    <div class="info-item">
      <div class="info-label">${t.fullName}</div>
      <div class="info-value">${data.customerFullname}</div>
    </div>
    <div class="info-item">
      <div class="info-label">${t.dni}</div>
      <div class="info-value">${data.customerDni}</div>
    </div>
    <div class="info-item">
      <div class="info-label">${t.phone}</div>
      <div class="info-value">${data.customerPhone}</div>
    </div>
    <div class="info-item">
      <div class="info-label">${t.email}</div>
      <div class="info-value">${data.customerEmail}</div>
    </div>
    <div class="info-item">
      <div class="info-label">${t.address}</div>
      <div class="info-value">${data.customerAddress}</div>
    </div>
    <div class="info-item">
      <div class="info-label">${t.license}</div>
      <div class="info-value">${data.driverLicense}</div>
    </div>
  </div>

  <div class="section-title">${t.rentalDetails}</div>
  <div class="info-grid">
    <div class="info-item">
      <div class="info-label">${t.pickupDate}</div>
      <div class="info-value">${data.pickupDate}</div>
    </div>
    <div class="info-item">
      <div class="info-label">${t.returnDate}</div>
      <div class="info-value">${data.returnDate}</div>
    </div>
    ${data.pickupLocation ? `
      <div class="info-item">
        <div class="info-label">${t.pickupLocation}</div>
        <div class="info-value">${data.pickupLocation}</div>
      </div>
    ` : ''}
    ${data.returnLocation ? `
      <div class="info-item">
        <div class="info-label">${t.returnLocation}</div>
        <div class="info-value">${data.returnLocation}</div>
      </div>
    ` : ''}
  </div>

  <div class="section-title">${t.vehicles}</div>
  <table>
    <thead>
      <tr>
        <th>${t.vehicle}</th>
        <th style="text-align: center;">${t.pricePerDay}</th>
        <th style="text-align: center;">${t.days}</th>
        <th style="text-align: right;">${t.total}</th>
      </tr>
    </thead>
    <tbody>
      ${vehiclesTableRows}
      ${extrasTableRows}
      ${upgradesTableRows}
    </tbody>
  </table>

  <div style="margin: 10px 0; padding: 8px; background: #edf2f7; border-radius: 4px;">
    <div style="display: flex; justify-content: space-between; font-size: 9px;">
      <span>${t.subtotal}:</span>
      <span style="font-weight: 600;">${data.subtotal.toFixed(2)}€</span>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 9px; margin-top: 4px;">
      <span>${t.iva} (21%):</span>
      <span style="font-weight: 600;">${data.iva.toFixed(2)}€</span>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; margin-top: 6px; padding-top: 6px; border-top: 2px solid ${primaryColor};">
      <span>${t.total}:</span>
      <span style="color: ${primaryColor};">${data.totalPrice}€</span>
    </div>
  </div>

  <div class="section-title">${t.vehicleInformation}</div>
  <table>
    <thead>
      <tr>
        <th>${t.model}</th>
        <th style="text-align: center;">${t.registration}</th>
        <th style="text-align: center;">${t.rentalPeriod}</th>
      </tr>
    </thead>
    <tbody>
      ${vehiclesInfoRows}
    </tbody>
  </table>

  ${additionalDriversSection}
  ${commentsSection}

  <div class="section-title">${t.termsAndConditions}</div>
  <div class="conditions-list">
    ${t.terms.map((term: string) => `<div class="condition-item">• ${term}</div>`).join('')}
  </div>

  ${signatureSection}

  <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 7px; color: #718096;">
    <p>${data.companyName || 'Alquilo Scooter'} - ${t.contractNumber}: ${data.contractNumber}</p>
    <p style="margin-top: 3px;">${t.contractDate}: ${data.contractDate}</p>
    <p style="margin-top: 3px; font-style: italic;">
      ⚠️ Las inspecciones fotográficas se envían por separado en PDF adjunto
    </p>
  </div>
</body>
</html>
  `;
}
