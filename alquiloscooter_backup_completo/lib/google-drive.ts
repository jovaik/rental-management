
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// Leer el token de autenticación de OAuth
function getAccessToken(): string {
  try {
    const secretsPath = '/home/ubuntu/.config/abacusai_auth_secrets.json';
    const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
    // Intentar con mayúsculas y minúsculas
    const token = secrets.GOOGLEDRIVEUSER?.secrets?.access_token?.value || 
                  secrets.googledriveuser?.secrets?.access_token?.value || 
                  '';
    return token;
  } catch (error) {
    console.error('Error leyendo token de Google Drive:', error);
    return '';
  }
}

// Crear cliente autenticado de Google Drive
function getDriveClient() {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    throw new Error('No se encontró token de Google Drive');
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  
  return google.drive({ version: 'v3', auth });
}

// Buscar o crear carpeta raíz
async function getRootFolder(drive: any): Promise<string> {
  const folderName = 'Reservas AlquiloScooter';
  
  // Buscar carpeta existente
  const response = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id;
  }

  // Crear carpeta raíz si no existe
  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };

  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id'
  });

  console.log('✅ Carpeta raíz creada en Google Drive:', folder.data.id);
  return folder.data.id;
}

// Buscar carpeta de reserva existente
async function findBookingFolder(drive: any, bookingNumber: string, parentId: string): Promise<string | null> {
  const response = await drive.files.list({
    q: `name contains '${bookingNumber}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id;
  }

  return null;
}

// Crear carpeta de reserva
export async function createBookingFolder(
  bookingNumber: string,
  customerName: string,
  customerId: number
): Promise<{ success: boolean; folderId?: string; folderUrl?: string; error?: string }> {
  try {
    const drive = getDriveClient();
    const rootFolderId = await getRootFolder(drive);

    // Verificar si ya existe
    const existingFolderId = await findBookingFolder(drive, bookingNumber, rootFolderId);
    if (existingFolderId) {
      return {
        success: true,
        folderId: existingFolderId,
        folderUrl: `https://drive.google.com/drive/folders/${existingFolderId}`
      };
    }

    // Crear nueva carpeta
    const folderName = `${bookingNumber} - ${customerName} (Cliente #${customerId})`;
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootFolderId]
    };

    const folder = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id, webViewLink'
    });

    console.log(`✅ Carpeta creada en Google Drive: ${folderName}`);
    
    return {
      success: true,
      folderId: folder.data.id!,
      folderUrl: folder.data.webViewLink || `https://drive.google.com/drive/folders/${folder.data.id}`
    };

  } catch (error: any) {
    console.error('❌ Error creando carpeta en Google Drive:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Subir archivo a carpeta de reserva
export async function uploadFileToBookingFolder(
  bookingNumber: string,
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<{ success: boolean; fileId?: string; fileUrl?: string; error?: string }> {
  try {
    const drive = getDriveClient();
    const rootFolderId = await getRootFolder(drive);
    
    // Buscar carpeta de reserva
    const folderId = await findBookingFolder(drive, bookingNumber, rootFolderId);
    
    if (!folderId) {
      return {
        success: false,
        error: `No se encontró carpeta para reserva ${bookingNumber}`
      };
    }

    // Verificar si el archivo ya existe
    const existingFiles = await drive.files.list({
      q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    // Si existe, eliminarlo primero (para actualizar)
    if (existingFiles.data.files && existingFiles.data.files.length > 0) {
      const fileId = existingFiles.data.files[0].id;
      if (fileId) {
        await drive.files.delete({
          fileId: fileId
        });
        console.log(`♻️ Archivo existente eliminado: ${fileName}`);
      }
    }

    // Subir archivo
    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };

    const media = {
      mimeType: mimeType,
      body: require('stream').Readable.from(fileBuffer)
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink'
    });

    console.log(`✅ Archivo subido a Google Drive: ${fileName}`);

    return {
      success: true,
      fileId: file.data.id!,
      fileUrl: file.data.webViewLink || `https://drive.google.com/file/d/${file.data.id}/view`
    };

  } catch (error: any) {
    console.error('❌ Error subiendo archivo a Google Drive:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Subir archivo desde S3 a Google Drive
export async function uploadFileFromS3ToGoogleDrive(
  bookingNumber: string,
  fileName: string,
  s3Key: string
): Promise<{ success: boolean; fileId?: string; fileUrl?: string; error?: string }> {
  try {
    // Descargar archivo de S3
    const { downloadFileAsBuffer } = await import('./s3');
    const fileBuffer = await downloadFileAsBuffer(s3Key);

    // Determinar MIME type basado en extensión
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    // Subir a Google Drive
    return await uploadFileToBookingFolder(bookingNumber, fileName, fileBuffer, mimeType);

  } catch (error: any) {
    console.error('❌ Error subiendo archivo desde S3 a Google Drive:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Copiar documentos del cliente a carpeta de reserva
export async function copyCustomerDocumentsToBooking(
  bookingNumber: string,
  customerId: number
): Promise<{ success: boolean; uploadedCount?: number; error?: string }> {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Obtener documentos del cliente
    const customer = await prisma.carRentalCustomers.findUnique({
      where: { id: customerId },
      select: {
        driver_license_front: true,
        driver_license_back: true,
        id_document_front: true,
        id_document_back: true
      }
    });

    if (!customer) {
      return { success: false, error: 'Cliente no encontrado' };
    }

    let uploadedCount = 0;
    const documents = [
      { key: customer.driver_license_front, name: 'Carnet_Conducir_Frontal.jpg' },
      { key: customer.driver_license_back, name: 'Carnet_Conducir_Trasero.jpg' },
      { key: customer.id_document_front, name: 'DNI_Frontal.jpg' },
      { key: customer.id_document_back, name: 'DNI_Trasero.jpg' }
    ];

    for (const doc of documents) {
      if (doc.key) {
        const result = await uploadFileFromS3ToGoogleDrive(bookingNumber, doc.name, doc.key);
        if (result.success) {
          uploadedCount++;
        }
      }
    }

    await prisma.$disconnect();
    
    return {
      success: true,
      uploadedCount
    };

  } catch (error: any) {
    console.error('❌ Error copiando documentos del cliente:', error);
    return {
      success: false,
      error: error.message
    };
  }
}


// Generar PDF de inspección y subirlo a Google Drive
export async function generateAndUploadInspectionPDF(
  bookingNumber: string,
  inspectionId: number,
  inspectionType: string
): Promise<{ success: boolean; fileId?: string; fileUrl?: string; error?: string }> {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const puppeteer = await import('puppeteer');
    
    // Obtener inspección con todos los datos
    const inspection = await prisma.vehicleInspections.findUnique({
      where: { id: inspectionId },
      include: {
        booking: {
          include: {
            customer: true,
            car: true
          }
        },
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
      return { success: false, error: 'Inspección no encontrada' };
    }

    // Descargar fotos de S3 y convertirlas a base64
    const { downloadFileAsBuffer } = await import('./s3');
    
    const getPhotoBase64 = async (s3Key: string | null) => {
      if (!s3Key) return null;
      try {
        const buffer = await downloadFileAsBuffer(s3Key);
        return `data:image/jpeg;base64,${buffer.toString('base64')}`;
      } catch {
        return null;
      }
    };

    const [frontPhoto, leftPhoto, rearPhoto, rightPhoto, odometerPhoto] = await Promise.all([
      getPhotoBase64(inspection.front_photo),
      getPhotoBase64(inspection.left_photo),
      getPhotoBase64(inspection.rear_photo),
      getPhotoBase64(inspection.right_photo),
      getPhotoBase64(inspection.odometer_photo)
    ]);

    // Generar HTML para el PDF
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Inspección ${inspectionType === 'CHECK_IN' ? 'de Entrada' : 'de Salida'} - ${bookingNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #d32f2f;
      padding-bottom: 15px;
    }
    .header h1 {
      color: #d32f2f;
      font-size: 20px;
      margin-bottom: 5px;
    }
    .header h2 {
      font-size: 14px;
      color: #555;
    }
    .info-section {
      background: #f5f5f5;
      padding: 10px;
      margin-bottom: 15px;
      border-radius: 4px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .info-label {
      font-weight: bold;
      color: #333;
    }
    .photos-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-bottom: 15px;
    }
    .photo-container {
      text-align: center;
    }
    .photo-container img {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .photo-container p {
      margin-top: 5px;
      font-weight: bold;
      color: #555;
    }
    .section-title {
      background: #d32f2f;
      color: white;
      padding: 8px;
      margin-top: 15px;
      margin-bottom: 10px;
      font-weight: bold;
      font-size: 13px;
    }
    .damage-item {
      background: #fff3cd;
      padding: 10px;
      margin-bottom: 10px;
      border-left: 3px solid #ffc107;
    }
    .notes-section {
      background: #e3f2fd;
      padding: 10px;
      margin-top: 15px;
      border-left: 3px solid #2196f3;
    }
    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 10px;
      color: #777;
      border-top: 1px solid #ddd;
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>ALQUILOSCOOTER</h1>
    <h2>Inspección ${inspectionType === 'CHECK_IN' ? 'de Entrada (CHECK-IN)' : 'de Salida (CHECK-OUT)'}</h2>
  </div>

  <div class="info-section">
    <div class="info-row">
      <span class="info-label">Nº Reserva:</span>
      <span>${bookingNumber}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Cliente:</span>
      <span>${inspection.booking.customer?.first_name || ''} ${inspection.booking.customer?.last_name || ''}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Vehículo:</span>
      <span>${inspection.booking.car?.model || 'N/A'} - ${inspection.booking.car?.registration_number || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Fecha Inspección:</span>
      <span>${new Date(inspection.inspection_date).toLocaleDateString('es-ES')}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Inspector:</span>
      <span>${inspection.inspector?.firstname || ''} ${inspection.inspector?.lastname || ''}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Odómetro:</span>
      <span>${inspection.odometer_reading || 'N/A'} km</span>
    </div>
    <div class="info-row">
      <span class="info-label">Nivel de Combustible:</span>
      <span>${inspection.fuel_level || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Condición General:</span>
      <span>${inspection.general_condition || 'N/A'}</span>
    </div>
  </div>

  <div class="section-title">FOTOGRAFÍAS DEL VEHÍCULO</div>
  <div class="photos-grid">
    ${frontPhoto ? `
    <div class="photo-container">
      <img src="${frontPhoto}" alt="Vista Frontal">
      <p>Vista Frontal</p>
    </div>` : ''}
    ${leftPhoto ? `
    <div class="photo-container">
      <img src="${leftPhoto}" alt="Vista Izquierda">
      <p>Vista Izquierda</p>
    </div>` : ''}
    ${rearPhoto ? `
    <div class="photo-container">
      <img src="${rearPhoto}" alt="Vista Trasera">
      <p>Vista Trasera</p>
    </div>` : ''}
    ${rightPhoto ? `
    <div class="photo-container">
      <img src="${rightPhoto}" alt="Vista Derecha">
      <p>Vista Derecha</p>
    </div>` : ''}
  </div>

  ${odometerPhoto ? `
  <div class="section-title">ODÓMETRO</div>
  <div style="text-align: center; margin-bottom: 15px;">
    <img src="${odometerPhoto}" alt="Odómetro" style="max-width: 400px; border: 1px solid #ddd; border-radius: 4px;">
  </div>` : ''}

  ${inspection.damages && inspection.damages.length > 0 ? `
  <div class="section-title">DAÑOS DETECTADOS</div>
  ${inspection.damages.map((damage: any) => `
    <div class="damage-item">
      <p><strong>Tipo:</strong> ${damage.damage_type || 'N/A'}</p>
      <p><strong>Ubicación:</strong> ${damage.location || 'N/A'}</p>
      <p><strong>Descripción:</strong> ${damage.description || 'N/A'}</p>
      ${damage.cost_estimate ? `<p><strong>Coste Estimado:</strong> €${damage.cost_estimate}</p>` : ''}
    </div>
  `).join('')}` : ''}

  ${inspection.notes ? `
  <div class="notes-section">
    <p><strong>Notas Adicionales:</strong></p>
    <p>${inspection.notes}</p>
  </div>` : ''}

  <div class="footer">
    <p>Este documento fue generado automáticamente por el sistema de gestión de Alquiloscooter</p>
    <p>Documento generado el ${new Date().toLocaleString('es-ES')}</p>
  </div>
</body>
</html>
    `;

    // Generar PDF con html-pdf-node (funcionaba el 07/11/2025)
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

    // Subir a Google Drive
    const fileName = `Inspeccion-${inspectionType === 'CHECK_IN' ? 'Entrada' : 'Salida'}-${bookingNumber}.pdf`;
    const result = await uploadFileToBookingFolder(
      bookingNumber,
      fileName,
      Buffer.from(pdfBuffer),
      'application/pdf'
    );

    await prisma.$disconnect();
    return result;

  } catch (error: any) {
    console.error('❌ Error generando PDF de inspección:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Generar justificante de devolución de fianza y subirlo a Google Drive
export async function generateAndUploadDepositReturnReceipt(
  bookingId: number
): Promise<{ success: boolean; fileId?: string; fileUrl?: string; error?: string }> {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const puppeteer = await import('puppeteer');
    
    // Obtener datos de la reserva y el depósito
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        car: true
      }
    });

    if (!booking) {
      return { success: false, error: 'Reserva no encontrada' };
    }

    // Buscar el último depósito que fue devuelto
    const deposit = await prisma.bookingDeposits.findFirst({
      where: { 
        booking_id: bookingId,
        estado: 'DEVUELTO'
      },
      orderBy: { fecha_devolucion: 'desc' }
    });

    if (!deposit) {
      return { success: false, error: 'No se encontró un depósito devuelto para esta reserva' };
    }

    const bookingNumber = booking.booking_number || `RES-${bookingId}`;

    // Generar HTML para el justificante
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Justificante Devolución Fianza - ${bookingNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      padding: 40px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #d32f2f;
      padding-bottom: 20px;
    }
    .header h1 {
      color: #d32f2f;
      font-size: 24px;
      margin-bottom: 10px;
    }
    .header h2 {
      font-size: 16px;
      color: #555;
      font-weight: normal;
    }
    .info-box {
      background: #f5f5f5;
      padding: 20px;
      margin-bottom: 20px;
      border-left: 4px solid #d32f2f;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px dotted #ccc;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: bold;
      color: #333;
      width: 40%;
    }
    .info-value {
      width: 60%;
      text-align: right;
    }
    .amounts-section {
      background: #e8f5e9;
      padding: 20px;
      margin: 20px 0;
      border: 2px solid #4caf50;
      border-radius: 8px;
    }
    .amounts-section h3 {
      color: #2e7d32;
      margin-bottom: 15px;
      font-size: 16px;
    }
    .amount-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 13px;
    }
    .amount-total {
      font-size: 18px;
      font-weight: bold;
      color: #2e7d32;
      border-top: 2px solid #4caf50;
      padding-top: 12px;
      margin-top: 12px;
    }
    .discounts-section {
      background: #fff3e0;
      padding: 15px;
      margin: 15px 0;
      border-left: 4px solid #ff9800;
    }
    .discounts-section h4 {
      color: #f57c00;
      margin-bottom: 10px;
      font-size: 14px;
    }
    .notes-section {
      background: #e3f2fd;
      padding: 15px;
      margin: 15px 0;
      border-left: 4px solid #2196f3;
    }
    .signature-section {
      margin-top: 40px;
      text-align: center;
    }
    .signature-line {
      border-top: 2px solid #333;
      margin: 50px auto 10px;
      width: 300px;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 10px;
      color: #777;
      border-top: 1px solid #ddd;
      padding-top: 15px;
    }
    .stamp-box {
      border: 2px solid #d32f2f;
      padding: 30px;
      margin: 30px auto;
      width: 400px;
      text-align: center;
      position: relative;
    }
    .stamp-box::before {
      content: "✓ PAGADO";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-15deg);
      font-size: 48px;
      color: rgba(211, 47, 47, 0.2);
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>ALQUILOSCOOTER</h1>
    <h2>JUSTIFICANTE DE DEVOLUCIÓN DE FIANZA</h2>
  </div>

  <div class="info-box">
    <div class="info-row">
      <span class="info-label">Nº Reserva:</span>
      <span class="info-value">${bookingNumber}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Cliente:</span>
      <span class="info-value">${booking.customer?.first_name || ''} ${booking.customer?.last_name || ''}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Email:</span>
      <span class="info-value">${booking.customer?.email || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Teléfono:</span>
      <span class="info-value">${booking.customer?.phone || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Vehículo:</span>
      <span class="info-value">${booking.car?.model || 'N/A'} - ${booking.car?.registration_number || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Fecha Recogida:</span>
      <span class="info-value">${booking.pickup_date ? new Date(booking.pickup_date).toLocaleDateString('es-ES') : 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Fecha Devolución:</span>
      <span class="info-value">${booking.return_date ? new Date(booking.return_date).toLocaleDateString('es-ES') : 'N/A'}</span>
    </div>
  </div>

  <div class="amounts-section">
    <h3>DETALLE DE IMPORTES</h3>
    <div class="amount-row">
      <span>Fianza Depositada:</span>
      <span><strong>€${deposit.monto_deposito?.toFixed(2) || '0.00'}</strong></span>
    </div>
    <div class="amount-row">
      <span>Fecha Depósito:</span>
      <span>${deposit.fecha_deposito ? new Date(deposit.fecha_deposito).toLocaleDateString('es-ES') : 'N/A'}</span>
    </div>
    <div class="amount-row">
      <span>Método Pago Depósito:</span>
      <span>${deposit.metodo_pago_deposito || 'N/A'}</span>
    </div>
  </div>

  ${(deposit.descuento_danos || deposit.descuento_multas || deposit.descuento_extensiones || deposit.descuento_otros) ? `
  <div class="discounts-section">
    <h4>DESCUENTOS APLICADOS</h4>
    ${deposit.descuento_danos ? `<div class="amount-row"><span>Daños:</span><span>-€${deposit.descuento_danos.toFixed(2)}</span></div>` : ''}
    ${deposit.descuento_multas ? `<div class="amount-row"><span>Multas:</span><span>-€${deposit.descuento_multas.toFixed(2)}</span></div>` : ''}
    ${deposit.descuento_extensiones ? `<div class="amount-row"><span>Extensiones:</span><span>-€${deposit.descuento_extensiones.toFixed(2)}</span></div>` : ''}
    ${deposit.descuento_otros ? `<div class="amount-row"><span>Otros:</span><span>-€${deposit.descuento_otros.toFixed(2)}</span></div>` : ''}
    <div class="amount-row" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ff9800;">
      <span><strong>Total Descontado:</strong></span>
      <span><strong>-€${deposit.monto_descontado?.toFixed(2) || '0.00'}</strong></span>
    </div>
  </div>` : ''}

  <div class="stamp-box">
    <div class="amount-row amount-total">
      <span>IMPORTE DEVUELTO:</span>
      <span>€${deposit.monto_devuelto?.toFixed(2) || '0.00'}</span>
    </div>
    <div style="margin-top: 15px; font-size: 12px;">
      <p><strong>Fecha Devolución:</strong> ${deposit.fecha_devolucion ? new Date(deposit.fecha_devolucion).toLocaleDateString('es-ES') : 'N/A'}</p>
      <p><strong>Método Devolución:</strong> ${deposit.metodo_devolucion || 'N/A'}</p>
    </div>
  </div>

  ${deposit.notas ? `
  <div class="notes-section">
    <p><strong>Notas:</strong></p>
    <p>${deposit.notas}</p>
  </div>` : ''}

  <div class="signature-section">
    <p>En prueba de conformidad,</p>
    <div class="signature-line"></div>
    <p><strong>${booking.customer?.first_name || ''} ${booking.customer?.last_name || ''}</strong></p>
    <p style="margin-top: 5px; color: #777;">Firma del Cliente</p>
  </div>

  <div class="footer">
    <p><strong>ALQUILOSCOOTER</strong></p>
    <p>Documento generado automáticamente el ${new Date().toLocaleString('es-ES')}</p>
    <p>Este justificante certifica la devolución de la fianza según las condiciones establecidas en el contrato de alquiler</p>
  </div>
</body>
</html>
    `;

    // Generar PDF con html-pdf-node (funcionaba el 07/11/2025)
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

    // Subir a Google Drive
    const fileName = `Justificante-Devolucion-Fianza-${bookingNumber}.pdf`;
    const result = await uploadFileToBookingFolder(
      bookingNumber,
      fileName,
      Buffer.from(pdfBuffer),
      'application/pdf'
    );

    await prisma.$disconnect();
    return result;

  } catch (error: any) {
    console.error('❌ Error generando justificante de devolución:', error);
    return {
      success: false,
      error: error.message
    };
  }
}