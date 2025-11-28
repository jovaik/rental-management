
import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/ubuntu/rental_management_app/app/.env' });
const prisma = new PrismaClient();

function getAccessToken() {
  try {
    const secretsPath = '/home/ubuntu/.config/abacusai_auth_secrets.json';
    const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
    return secrets.GOOGLEDRIVEUSER?.secrets?.access_token?.value || 
           secrets.googledriveuser?.secrets?.access_token?.value || '';
  } catch (error) {
    console.error('❌ Error leyendo token:', error);
    return '';
  }
}

function getDriveClient() {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error('No se encontró token de Google Drive');
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: 'v3', auth });
}

async function downloadFileFromS3(s3Key) {
  try {
    const { GetObjectCommand, S3Client } = await import('@aws-sdk/client-s3');
    const s3Client = new S3Client({});
    const bucketName = process.env.AWS_BUCKET_NAME;
    const command = new GetObjectCommand({ Bucket: bucketName, Key: s3Key });
    const response = await s3Client.send(command);
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (error) {
    return null;
  }
}

async function listFilesInFolder(drive, folderId) {
  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });
    return response.data.files || [];
  } catch (error) {
    return [];
  }
}

async function uploadFile(drive, folderId, fileName, fileBuffer, mimeType, existingFiles) {
  try {
    const existing = existingFiles.find(f => f.name === fileName);
    if (existing) {
      return { success: true, skipped: true };
    }
    
    const { Readable } = await import('stream');
    const file = await drive.files.create({
      requestBody: { name: fileName, parents: [folderId] },
      media: { mimeType, body: Readable.from(fileBuffer) },
      fields: 'id'
    });
    
    return { success: true, skipped: false };
  } catch (error) {
    return { success: false };
  }
}

async function syncDocs() {
  try {
    const drive = getDriveClient();
    console.log('🔄 SINCRONIZACIÓN DE DOCUMENTOS EXISTENTES\n');
    console.log('═'.repeat(80));
    
    const bookings = await prisma.carRentalBookings.findMany({
      where: { google_drive_folder_id: { not: null } },
      include: { customer: true, car: true, contract: true, inspections: true },
      orderBy: { id: 'desc' }
    });
    
    console.log(`📊 Total de reservas: ${bookings.length}\n`);
    
    let stats = { cliente: 0, contratos: 0, fotos: 0, skipped: 0, errors: 0 };
    
    for (const booking of bookings) {
      const bookingNumber = booking.booking_number || `RES-${booking.id}`;
      console.log(`\n📁 ${bookingNumber}`);
      
      const folderId = booking.google_drive_folder_id;
      const existingFiles = await listFilesInFolder(drive, folderId);
      console.log(`   📋 Archivos existentes: ${existingFiles.length}`);
      
      // 1. DOCUMENTOS DEL CLIENTE
      if (booking.customer) {
        const docs = [
          { key: booking.customer.driver_license_front, name: 'Carnet_Conducir_Frontal.jpg' },
          { key: booking.customer.driver_license_back, name: 'Carnet_Conducir_Trasero.jpg' },
          { key: booking.customer.id_document_front, name: 'DNI_Frontal.jpg' },
          { key: booking.customer.id_document_back, name: 'DNI_Trasero.jpg' }
        ];
        
        for (const doc of docs) {
          if (doc.key) {
            const buffer = await downloadFileFromS3(doc.key);
            if (buffer) {
              const result = await uploadFile(drive, folderId, doc.name, buffer, 'image/jpeg', existingFiles);
              if (result.success) {
                if (result.skipped) {
                  stats.skipped++;
                } else {
                  console.log(`   ✅ ${doc.name}`);
                  stats.cliente++;
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
        const buffer = await downloadFileFromS3(booking.contract.pdf_path);
        if (buffer) {
          const fileName = `Contrato-${bookingNumber}.pdf`;
          const result = await uploadFile(drive, folderId, fileName, buffer, 'application/pdf', existingFiles);
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
      
      // 3. FOTOS DE INSPECCIÓN
      if (booking.inspections?.length > 0) {
        for (const [index, inspection] of booking.inspections.entries()) {
          const inspType = inspection.inspection_type === 'return' ? 'Salida' : 'Entrada';
          const suffix = booking.inspections.length > 1 ? `-${index + 1}` : '';
          
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
                    stats.fotos++;
                  }
                } else {
                  stats.errors++;
                }
              }
            }
          }
        }
      }
      
      // Pausa breve para no saturar la API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n✅ SINCRONIZACIÓN COMPLETADA\n');
    console.log(`   📄 Docs cliente: ${stats.cliente}`);
    console.log(`   📑 Contratos: ${stats.contratos}`);
    console.log(`   📷 Fotos inspección: ${stats.fotos}`);
    console.log(`   ⏭️  Ya existían: ${stats.skipped}`);
    console.log(`   ❌ Errores: ${stats.errors}`);
    console.log(`\n   📊 TOTAL NUEVO: ${stats.cliente + stats.contratos + stats.fotos}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

syncDocs();
