const fs = require('fs');
const { google } = require('googleapis');

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

async function cleanDriveDuplicates() {
  try {
    console.log('🧹 Limpiando fotos duplicadas de Google Drive...\n');
    
    const drive = getDriveClient();
    
    // Buscar carpeta de la reserva
    const rootResponse = await drive.files.list({
      q: `name='Reservas AlquiloScooter' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });
    
    if (!rootResponse.data.files || rootResponse.data.files.length === 0) {
      console.log('❌ No se encontró la carpeta raíz');
      return;
    }
    
    const rootId = rootResponse.data.files[0].id;
    console.log(`✅ Carpeta raíz encontrada: ${rootId}\n`);
    
    // Buscar carpeta de la reserva 202510260001
    const bookingResponse = await drive.files.list({
      q: `name contains '202510260001' and '${rootId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });
    
    if (!bookingResponse.data.files || bookingResponse.data.files.length === 0) {
      console.log('❌ No se encontró la carpeta de la reserva');
      return;
    }
    
    const folderId = bookingResponse.data.files[0].id;
    const folderName = bookingResponse.data.files[0].name;
    console.log(`✅ Carpeta encontrada: ${folderName}`);
    console.log(`   ID: ${folderId}\n`);
    
    // Listar todos los archivos en la carpeta
    const filesResponse = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, createdTime)',
      spaces: 'drive'
    });
    
    const files = filesResponse.data.files || [];
    console.log(`📁 Archivos encontrados: ${files.length}\n`);
    
    // Separar archivos por tipo
    const photoFiles = files.filter(f => f.mimeType.startsWith('image/'));
    const pdfFiles = files.filter(f => f.mimeType === 'application/pdf');
    const otherFiles = files.filter(f => !f.mimeType.startsWith('image/') && f.mimeType !== 'application/pdf');
    
    console.log(`   📸 Fotos: ${photoFiles.length}`);
    console.log(`   📄 PDFs: ${pdfFiles.length}`);
    console.log(`   📁 Otros: ${otherFiles.length}\n`);
    
    // Mostrar todas las fotos
    if (photoFiles.length > 0) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📸 FOTOS EN DRIVE:\n`);
      photoFiles.forEach((file, idx) => {
        console.log(`   ${idx+1}. ${file.name} (${file.createdTime})`);
      });
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    }
    
    // Las fotos válidas deben contener timestamps específicos de las inspecciones 24 y 25
    // Inspección 24: 1762418197... (6 nov 8:36:37)
    // Inspección 25: 1762418199... (6 nov 8:36:39)
    
    const validTimestamps = ['1762418197', '1762418199'];
    const invalidPhotos = photoFiles.filter(file => {
      return !validTimestamps.some(ts => file.name.includes(ts));
    });
    
    console.log(`⚠️  Fotos a eliminar: ${invalidPhotos.length}\n`);
    
    if (invalidPhotos.length > 0) {
      console.log(`🗑️  Eliminando fotos duplicadas/antiguas:\n`);
      
      for (const file of invalidPhotos) {
        try {
          await drive.files.delete({
            fileId: file.id
          });
          console.log(`   ✅ Eliminado: ${file.name}`);
        } catch (error) {
          console.log(`   ❌ Error eliminando ${file.name}: ${error.message}`);
        }
      }
      
      console.log(`\n✅ Limpieza completada`);
      console.log(`   Fotos eliminadas: ${invalidPhotos.length}`);
      console.log(`   Fotos restantes: ${photoFiles.length - invalidPhotos.length}\n`);
    } else {
      console.log(`✅ No hay fotos duplicadas para eliminar\n`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

cleanDriveDuplicates();
