import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';
import fs from 'fs';

const prisma = new PrismaClient();

// Función para obtener cliente de Drive
function getDriveClient() {
  const secretsPath = '/home/ubuntu/.config/abacusai_auth_secrets.json';
  const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
  const token = secrets.googledriveuser?.secrets?.access_token?.value;
  
  if (!token) {
    throw new Error('No se encontró token de Google Drive');
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: token });
  return google.drive({ version: 'v3', auth });
}

// Obtener o crear carpeta raíz
async function getRootFolder(drive) {
  const folderName = 'Reservas AlquiloScooter';
  
  const response = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id;
  }

  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };

  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id'
  });

  return folder.data.id;
}

// Buscar carpeta existente
async function findBookingFolder(drive, bookingNumber, parentId) {
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
async function createBookingFolderDirect(drive, rootFolderId, bookingNumber, customerName, customerId) {
  // Verificar si ya existe
  const existingFolderId = await findBookingFolder(drive, bookingNumber, rootFolderId);
  if (existingFolderId) {
    return {
      success: true,
      folderId: existingFolderId,
      folderUrl: `https://drive.google.com/drive/folders/${existingFolderId}`,
      existed: true
    };
  }

  // Crear nueva carpeta
  const folderName = `${bookingNumber} - ${customerName} (Cliente #${customerId || 'Sin ID'})`;
  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [rootFolderId]
  };

  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id, webViewLink'
  });

  return {
    success: true,
    folderId: folder.data.id,
    folderUrl: folder.data.webViewLink || `https://drive.google.com/drive/folders/${folder.data.id}`,
    existed: false
  };
}

async function syncAllBookings() {
  console.log('🔄 Sincronización masiva de reservas a Google Drive\n');
  console.log('═'.repeat(60));
  
  try {
    // Obtener reservas sin sincronizar
    const unsyncedBookings = await prisma.carRentalBookings.findMany({
      where: {
        google_drive_folder_id: null
      },
      orderBy: { id: 'desc' },
      include: {
        customer: true
      }
    });
    
    console.log(`\n📊 Encontradas ${unsyncedBookings.length} reservas sin sincronizar\n`);
    
    if (unsyncedBookings.length === 0) {
      console.log('✅ Todas las reservas ya están sincronizadas');
      return;
    }
    
    const drive = getDriveClient();
    const rootFolderId = await getRootFolder(drive);
    console.log(`📁 Carpeta raíz: ${rootFolderId}\n`);
    
    let successCount = 0;
    let errorCount = 0;
    let existedCount = 0;
    
    for (const booking of unsyncedBookings) {
      const bookingNumber = booking.booking_number || `RES-${booking.id}`;
      const customerName = booking.customer_name || 
                          `${booking.customer?.first_name || ''} ${booking.customer?.last_name || ''}`.trim() ||
                          'Cliente Desconocido';
      const customerId = booking.customer_id;
      
      process.stdout.write(`  Procesando #${bookingNumber} (${customerName})... `);
      
      try {
        const result = await createBookingFolderDirect(
          drive,
          rootFolderId,
          bookingNumber,
          customerName,
          customerId
        );
        
        if (result.success) {
          // Actualizar DB
          await prisma.carRentalBookings.update({
            where: { id: booking.id },
            data: {
              google_drive_folder_id: result.folderId,
              google_drive_folder_url: result.folderUrl
            }
          });
          
          if (result.existed) {
            console.log('✅ Ya existía');
            existedCount++;
          } else {
            console.log('✅ Creada');
          }
          successCount++;
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        errorCount++;
      }
      
      // Pequeña pausa para no saturar la API
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('\n📊 RESUMEN:');
    console.log(`   ✅ Sincronizadas exitosamente: ${successCount}`);
    console.log(`   ♻️  Ya existían: ${existedCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log(`   📁 Total procesadas: ${unsyncedBookings.length}`);
    
    if (successCount > 0) {
      console.log('\n✅ ¡Sincronización completada! Las carpetas están disponibles en Drive.');
    }
    
  } catch (error) {
    console.error('\n❌ Error fatal:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

syncAllBookings();
