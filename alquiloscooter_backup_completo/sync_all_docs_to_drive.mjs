import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '/home/ubuntu/rental_management_app/app/.env' });

const prisma = new PrismaClient();

// Leer token OAuth
function getAccessToken() {
  try {
    const secretsPath = '/home/ubuntu/.config/abacusai_auth_secrets.json';
    const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
    return secrets.GOOGLEDRIVEUSER?.secrets?.access_token?.value || 
           secrets.googledriveuser?.secrets?.access_token?.value || 
           '';
  } catch (error) {
    console.error('❌ Error leyendo token:', error);
    return '';
  }
}

// Crear cliente de Drive
function getDriveClient() {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error('No se encontró token de Google Drive');
  }
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: 'v3', auth });
}

// Descargar archivo de S3
async function downloadFileFromS3(s3Key) {
  try {
    const { GetObjectCommand, S3Client } = await import('@aws-sdk/client-s3');
    const s3Client = new S3Client({});
    
    const bucketName = process.env.AWS_BUCKET_NAME;
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key
    });
    
    const response = await s3Client.send(command);
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (error) {
    console.error(`   ❌ Error descargando ${s3Key}:`, error.message);
    return null;
  }
}

// Listar archivos existentes en carpeta de Drive
async function listFilesInFolder(drive, folderId) {
  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });
    return response.data.files || [];
  } catch (error) {
    console.error('❌ Error listando archivos:', error.message);
    return [];
  }
}

// Subir archivo a Google Drive (sin duplicados)
async function uploadFile(drive, folderId, fileName, fileBuffer, mimeType, existingFiles) {
  try {
    // Verificar si el archivo ya existe en la lista precargada
    const existing = existingFiles.find(f => f.name === fileName);
    
    if (existing) {
      // Ya existe, no lo subimos
      return { success: true, fileId: existing.id, skipped: true };
    }
    
    // Subir archivo nuevo
    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };
    
    const { Readable } = await import('stream');
    const media = {
      mimeType: mimeType,
      body: Readable.from(fileBuffer)
    };
    
    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink'
    });
    
    return { success: true, fileId: file.data.id, skipped: false };
  } catch (error) {
    console.error(`   ❌ Error subiendo ${fileName}:`, error.message);
    return { success: false, error: error.message, skipped: false };
  }
}

// Generar PDF de inspección
async function generateInspectionPDF(inspection, booking) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    
    // Descargar fotos de S3 y convertirlas a base64
    const getPhotoBase64 = async (s3Key) => {
      if (!s3Key) return null;
      try {
        const buffer = await downloadFileFromS3(s3Key);
        return buffer ? `data:image/jpeg;base64,${buffer.toString('base64')}` : null;
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

    const inspType = inspection.inspection_type === 'return' ? 'SALIDA (CHECK-OUT)' : 'ENTRADA (CHECK-IN)';
    const bookingNumber = booking.booking_number || `RES-${booking.id}`;

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Inspección ${inspType} - ${bookingNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.4; padding: 20px; }
    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #d32f2f; padding-bottom: 15px; }
    .header h1 { color: #d32f2f; font-size: 20px; margin-bottom: 5px; }
    .header h2 { font-size: 14px; color: #555; }
    .info-section { background: #f5f5f5; padding: 10px; margin-bottom: 15px; border-radius: 4px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
    .info-label { font-weight: bold; color: #333; }
    .photos-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px; }
    .photo-container { text-align: center; }
    .photo-container img { width: 100%; height: 200px; object-fit: cover; border: 1px solid #ddd; border-radius: 4px; }
    .photo-container p { margin-top: 5px; font-weight: bold; color: #555; }
    .section-title { background: #d32f2f; color: white; padding: 8px; margin-top: 15px; margin-bottom: 10px; font-weight: bold; font-size: 13px; }
    .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #777; border-top: 1px solid #ddd; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>ALQUILOSCOOTER</h1>
    <h2>Inspección ${inspType}</h2>
  </div>
  <div class="info-section">
    <div class="info-row"><span class="info-label">Nº Reserva:</span><span>${bookingNumber}</span></div>
    <div class="info-row"><span class="info-label">Cliente:</span><span>${booking.customer?.first_name || ''} ${booking.customer?.last_name || ''}</span></div>
    <div class="info-row"><span class="info-label">Vehículo:</span><span>${booking.car?.model || 'N/A'} - ${booking.car?.registration_number || 'N/A'}</span></div>
    <div class="info-row"><span class="info-label">Fecha Inspección:</span><span>${new Date(inspection.inspection_date).toLocaleDateString('es-ES')}</span></div>
    <div class="info-row"><span class="info-label">Odómetro:</span><span>${inspection.odometer_reading || 'N/A'} km</span></div>
    <div class="info-row"><span class="info-label">Combustible:</span><span>${inspection.fuel_level || 'N/A'}</span></div>
  </div>
  <div class="section-title">FOTOGRAFÍAS DEL VEHÍCULO</div>
  <div class="photos-grid">
    ${frontPhoto ? `<div class="photo-container"><img src="${frontPhoto}" alt="Frontal"><p>Vista Frontal</p></div>` : ''}
    ${leftPhoto ? `<div class="photo-container"><img src="${leftPhoto}" alt="Izquierda"><p>Vista Izquierda</p></div>` : ''}
    ${rearPhoto ? `<div class="photo-container"><img src="${rearPhoto}" alt="Trasera"><p>Vista Trasera</p></div>` : ''}
    ${rightPhoto ? `<div class="photo-container"><img src="${rightPhoto}" alt="Derecha"><p>Vista Derecha</p></div>` : ''}
  </div>
  ${odometerPhoto ? `<div class="section-title">ODÓMETRO</div><div style="text-align: center; margin-bottom: 15px;"><img src="${odometerPhoto}" alt="Odómetro" style="max-width: 400px; border: 1px solid #ddd; border-radius: 4px;"></div>` : ''}
  <div class="footer">
    <p>Documento generado automáticamente por el sistema de gestión de Alquiloscooter</p>
    <p>Generado el ${new Date().toLocaleString('es-ES')}</p>
  </div>
</body>
</html>
    `;

    await page.setContent(html, { waitUntil: 'load', timeout: 60000 });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' } });
    await browser.close();
    
    return Buffer.from(pdfBuffer);
  } catch (error) {
    await browser.close();
    throw error;
  }
}

async function syncAllDocs() {
  try {
    const drive = getDriveClient();
    
    console.log('🔄 SINCRONIZACIÓN COMPLETA DE DOCUMENTOS A GOOGLE DRIVE\n');
    console.log('═'.repeat(80));
    
    // Obtener reservas con carpeta de Drive
    const bookings = await prisma.carRentalBookings.findMany({
      where: { google_drive_folder_id: { not: null } },
      include: {
        customer: true,
        car: true,
        contract: true,
        inspections: {
          include: {
            booking: { include: { customer: true, car: true } },
            inspector: { select: { firstname: true, lastname: true } }
          }
        }
      },
      orderBy: { id: 'desc' }
    });
    
    console.log(`📊 Total de reservas con carpeta Drive: ${bookings.length}\n`);
    
    let stats = {
      docsCliente: 0,
      fotosInspeccion: 0,
      pdfsInspeccion: 0,
      contratos: 0,
      skipped: 0,
      errors: 0
    };
    
    for (const booking of bookings) {
      const bookingNumber = booking.booking_number || `RES-${booking.id}`;
      console.log(`\n📁 ${bookingNumber}`);
      
      const folderId = booking.google_drive_folder_id;
      
      // Listar archivos existentes (para evitar duplicados)
      const existingFiles = await listFilesInFolder(drive, folderId);
      console.log(`   📋 Archivos existentes: ${existingFiles.length}`);
      
      // 1. DOCUMENTOS DEL CLIENTE
      if (booking.customer) {
        const docs = [
          { key: booking.customer.driver_license_front, name: 'Carnet_Conducir_Frontal.jpg', type: 'image/jpeg' },
          { key: booking.customer.driver_license_back, name: 'Carnet_Conducir_Trasero.jpg', type: 'image/jpeg' },
          { key: booking.customer.id_document_front, name: 'DNI_Frontal.jpg', type: 'image/jpeg' },
          { key: booking.customer.id_document_back, name: 'DNI_Trasero.jpg', type: 'image/jpeg' }
        ];
        
        for (const doc of docs) {
          if (doc.key) {
            const buffer = await downloadFileFromS3(doc.key);
            if (buffer) {
              const result = await uploadFile(drive, folderId, doc.name, buffer, doc.type, existingFiles);
              if (result.success) {
                if (result.skipped) {
                  stats.skipped++;
                } else {
                  console.log(`   ✅ ${doc.name}`);
                  stats.docsCliente++;
                }
              } else {
                stats.errors++;
              }
            }
          }
        }
      }
      
      // 2. CONTRATOS
      if (booking.contract?.pdf_path) {
        const contractBuffer = await downloadFileFromS3(booking.contract.pdf_path);
        if (contractBuffer) {
          const fileName = `Contrato-${bookingNumber}.pdf`;
          const result = await uploadFile(drive, folderId, fileName, contractBuffer, 'application/pdf', existingFiles);
          if (result.success) {
            if (result.skipped) {
              stats.skipped++;
            } else {
              console.log(`   ✅ ${fileName}`);
              stats.contratos++;
            }
          } else {
            stats.errors++;
          }
        }
      }
      
      // 3. INSPECCIONES (FOTOS + PDFS)
      if (booking.inspections && booking.inspections.length > 0) {
        for (const [index, inspection] of booking.inspections.entries()) {
          const inspType = inspection.inspection_type === 'return' ? 'Salida' : 'Entrada';
          const suffix = booking.inspections.length > 1 ? `-${index + 1}` : '';
          
          // 3a. Fotos de inspección
          const photos = [
            { key: inspection.front_photo, name: `Inspeccion-${inspType}${suffix}-Frontal.jpg` },
            { key: inspection.left_photo, name: `Inspeccion-${inspType}${suffix}-Izquierda.jpg` },
            { key: inspection.rear_photo, name: `Inspeccion-${inspType}${suffix}-Trasera.jpg` },
            { key: inspection.right_photo, name: `Inspeccion-${inspType}${suffix}-Derecha.jpg` },
            { key: inspection.odometer_photo, name: `Inspeccion-${inspType}${suffix}-Odometro.jpg` }
          ];
          
          for (const photo of photos) {
            if (photo.key) {
              const buffer = await downloadFileFromS3(photo.key);
              if (buffer) {
                const result = await uploadFile(drive, folderId, photo.name, buffer, 'image/jpeg', existingFiles);
                if (result.success) {
                  if (result.skipped) {
                    stats.skipped++;
                  } else {
                    console.log(`   ✅ ${photo.name}`);
                    stats.fotosInspeccion++;
                  }
                } else {
                  stats.errors++;
                }
              }
            }
          }
          
          // 3b. PDF de inspección
          try {
            const pdfFileName = `Inspeccion-${inspType}${suffix}-${bookingNumber}.pdf`;
            const existsPDF = existingFiles.find(f => f.name === pdfFileName);
            
            if (!existsPDF) {
              console.log(`   📄 Generando ${pdfFileName}...`);
              const pdfBuffer = await generateInspectionPDF(inspection, booking);
              const result = await uploadFile(drive, folderId, pdfFileName, pdfBuffer, 'application/pdf', existingFiles);
              if (result.success) {
                console.log(`   ✅ ${pdfFileName}`);
                stats.pdfsInspeccion++;
              } else {
                stats.errors++;
              }
            } else {
              stats.skipped++;
            }
          } catch (error) {
            console.log(`   ❌ Error generando PDF inspección: ${error.message}`);
            stats.errors++;
          }
        }
      }
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n✅ SINCRONIZACIÓN COMPLETADA\n');
    console.log(`   📄 Documentos cliente: ${stats.docsCliente}`);
    console.log(`   📷 Fotos inspección: ${stats.fotosInspeccion}`);
    console.log(`   📋 PDFs inspección: ${stats.pdfsInspeccion}`);
    console.log(`   📑 Contratos: ${stats.contratos}`);
    console.log(`   ⏭️  Ya existían: ${stats.skipped}`);
    console.log(`   ❌ Errores: ${stats.errors}`);
    console.log(`\n   📊 TOTAL SUBIDOS: ${stats.docsCliente + stats.fotosInspeccion + stats.pdfsInspeccion + stats.contratos}`);
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('\n❌ Error en sincronización:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

syncAllDocs();
