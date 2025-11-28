
import type { InspectionImageFiles } from './inspection-image-files';

interface InspectionHTMLData {
  bookingNumber: string;
  inspectionDate: string;
  customerName: string;
  customerId: string;
  vehicleMakeModel: string;
  vehiclePlate: string;
  odometer: string;
  fuelLevel: string;
  generalCondition: string;
  inspectorName: string;
}

/**
 * Genera HTML de inspección usando rutas de archivos locales en lugar de Base64.
 */
export function generateInspectionHTMLFromFiles(
  data: InspectionHTMLData,
  imageFiles: InspectionImageFiles
): string {
  const frontSrc = imageFiles.front ? `file://${imageFiles.front}` : '';
  const leftSrc = imageFiles.left ? `file://${imageFiles.left}` : '';
  const rearSrc = imageFiles.rear ? `file://${imageFiles.rear}` : '';
  const rightSrc = imageFiles.right ? `file://${imageFiles.right}` : '';
  const odometerSrc = imageFiles.odometer ? `file://${imageFiles.odometer}` : '';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Inspección ${data.bookingNumber}</title>
  <style>
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #333;
      padding: 20mm;
      margin: 0;
    }
    header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #FF6B35;
      padding-bottom: 10px;
    }
    h1 {
      font-size: 18pt;
      color: #FF6B35;
      margin: 0 0 5px 0;
    }
    h2 {
      font-size: 14pt;
      color: #666;
      margin: 0;
    }
    .info-section {
      margin: 15px 0;
      padding: 10px;
      background: #f9f9f9;
      border-radius: 4px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
    }
    .info-label {
      font-weight: bold;
      color: #555;
    }
    .photos-section {
      margin-top: 20px;
    }
    .photos-section h3 {
      font-size: 14pt;
      color: #FF6B35;
      margin-bottom: 10px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
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
  </style>
</head>
<body>
  <header>
    <h1>INSPECCIÓN DE DEVOLUCIÓN</h1>
    <h2>Reserva: ${data.bookingNumber}</h2>
  </header>

  <div class="info-section">
    <div class="info-row">
      <span class="info-label">Fecha Inspección:</span>
      <span>${data.inspectionDate}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Cliente:</span>
      <span>${data.customerName} (ID: ${data.customerId})</span>
    </div>
    <div class="info-row">
      <span class="info-label">Vehículo:</span>
      <span>${data.vehicleMakeModel}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Matrícula:</span>
      <span>${data.vehiclePlate}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Odómetro:</span>
      <span>${data.odometer} km</span>
    </div>
    <div class="info-row">
      <span class="info-label">Nivel Combustible:</span>
      <span>${data.fuelLevel}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Estado General:</span>
      <span>${data.generalCondition}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Inspector:</span>
      <span>${data.inspectorName}</span>
    </div>
  </div>

  <div class="photos-section">
    <h3>Fotografías de la Inspección</h3>
    <div class="photos-grid">
      ${frontSrc ? `
      <div class="photo-item">
        <img src="${frontSrc}" alt="Frontal" />
        <p>Frontal</p>
      </div>` : ''}

      ${leftSrc ? `
      <div class="photo-item">
        <img src="${leftSrc}" alt="Lateral Izquierdo" />
        <p>Lateral Izquierdo</p>
      </div>` : ''}

      ${rearSrc ? `
      <div class="photo-item">
        <img src="${rearSrc}" alt="Trasera" />
        <p>Trasera</p>
      </div>` : ''}

      ${rightSrc ? `
      <div class="photo-item">
        <img src="${rightSrc}" alt="Lateral Derecho" />
        <p>Lateral Derecho</p>
      </div>` : ''}

      ${odometerSrc ? `
      <div class="photo-item">
        <img src="${odometerSrc}" alt="Odómetro" />
        <p>Odómetro</p>
      </div>` : ''}
    </div>
  </div>
</body>
</html>
`;
}
