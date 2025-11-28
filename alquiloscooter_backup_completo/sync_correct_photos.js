require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const { google } = require('googleapis');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Readable } = require('stream');

const prisma = new PrismaClient();

// Leer token de Google Drive
function getAccessToken() {
  try {
    const secretsPath = '/home/ubuntu/.config/abacusai_auth_secrets.json';
    const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
    const token = secrets.GOOGLEDRIVEUSER?.secrets?.access_token?.value || 
                  secrets.googledriveuser?.secrets?.access_token?.value || 
                  '';
    return token;
  } catch (error) {
    console.error('Error leyendo token:', error);
    return '';
  }
}

// Crear cliente de Google Drive
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
async function downloadFromS3(s3Key) {
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
}

// Buscar carpeta de reserva
async function findBookingFolder(drive, bookingNumber) {
  // Buscar carpeta raíz
  const rootResponse = await drive.files.list({
    q: `name='Reservas AlquiloScooter' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive'
  });
  
  if (!rootResponse.data.files || rootResponse.data.files.length === 0) {
    throw new Error('No se encontró carpeta raíz');
  }
  
  const rootId = rootResponse.data.files[0].id;
  
  // Buscar carpeta de reserva
  const bookingResponse = await drive.files.list({
    q: `name contains '${bookingNumber}' and '${rootId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive'
  });
  
  if (!bookingResponse.data.files || bookingResponse.data.files.length === 0) {
    throw new Error(`No se encontró carpeta para reserva ${bookingNumber}`);
  }
  
  return bookingResponse.data.files[0].id;
}

// Subir archivo a Drive
async function uploadToDrive(drive, folderId, fileName, fileBuffer) {
  const fileMetadata = {
    name: fileName,
    parents: [folderId]
  };
  
  const media = {
    mimeType: 'image/jpeg',
    body: Readable.from(fileBuffer)
  };
  
  const file = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, webViewLink'
  });
  
  return file.data;
}

async function syncCorrectPhotos() {
  try {
    console.log('📤 Subiendo fotos correctas a Google Drive...\n');
    
    // Obtener las inspecciones válidas
    const booking = await prisma.carRentalBookings.findFirst({
      where: { booking_number: '202510260001' },
      include: {
        inspections: {
          where: {
            id: { in: [24, 25] }
          },
          include: {
            vehicle: {
              select: {
                registration_number: true
              }
            }
          },
          orderBy: { id: 'asc' }
        }
      }
    });
    
    if (!booking) {
      console.log('❌ Reserva no encontrada');
      return;
    }
    
    console.log(`📋 Reserva: ${booking.booking_number}`);
    console.log(`📸 Inspecciones a sincronizar: ${booking.inspections.length}\n`);
    
    const drive = getDriveClient();
    const folderId = await findBookingFolder(drive, booking.booking_number);
    console.log(`✅ Carpeta encontrada: ${folderId}\n`);
    
    let totalUploaded = 0;
    
    for (const insp of booking.inspections) {
      const vehiclePlate = insp.vehicle?.registration_number || 'Unknown';
      console.log(`🔄 Sincronizando inspección ID ${insp.id} (${vehiclePlate})...`);
      
      const photos = [
        { key: insp.front_photo, name: `Inspeccion-Entrada-${insp.id}-Frontal.jpg` },
        { key: insp.left_photo, name: `Inspeccion-Entrada-${insp.id}-Izquierda.jpg` },
        { key: insp.rear_photo, name: `Inspeccion-Entrada-${insp.id}-Trasera.jpg` },
        { key: insp.right_photo, name: `Inspeccion-Entrada-${insp.id}-Derecha.jpg` },
        { key: insp.odometer_photo, name: `Inspeccion-Entrada-${insp.id}-Odometro.jpg` }
      ];
      
      for (const photo of photos) {
        if (photo.key) {
          try {
            const buffer = await downloadFromS3(photo.key);
            await uploadToDrive(drive, folderId, photo.name, buffer);
            console.log(`   ✅ ${photo.name}`);
            totalUploaded++;
          } catch (error) {
            console.log(`   ❌ ${photo.name}: ${error.message}`);
          }
        }
      }
      console.log('');
    }
    
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ SINCRONIZACIÓN COMPLETADA`);
    console.log(`   Fotos subidas: ${totalUploaded}/10`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

syncCorrectPhotos();
