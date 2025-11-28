import { google } from 'googleapis';
import fs from 'fs';

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

async function testDrive() {
  try {
    const token = getAccessToken();
    
    if (!token) {
      console.error('❌ No se encontró token de Google Drive');
      return;
    }
    
    console.log('✅ Token encontrado:', token.substring(0, 20) + '...');
    
    // Crear cliente
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: token });
    const drive = google.drive({ version: 'v3', auth });
    
    // Test 1: Listar carpetas
    console.log('\n📁 Listando carpetas en Drive...');
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id, name)',
      spaces: 'drive',
      pageSize: 10
    });
    
    console.log(`✅ Se encontraron ${response.data.files?.length || 0} carpetas`);
    
    if (response.data.files && response.data.files.length > 0) {
      console.log('\nPrimeras carpetas:');
      response.data.files.slice(0, 5).forEach(file => {
        console.log(`  - ${file.name} (ID: ${file.id})`);
      });
    }
    
    // Test 2: Buscar carpeta raíz
    console.log('\n🔍 Buscando carpeta "Reservas AlquiloScooter"...');
    const rootSearch = await drive.files.list({
      q: "name='Reservas AlquiloScooter' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id, name)',
      spaces: 'drive'
    });
    
    if (rootSearch.data.files && rootSearch.data.files.length > 0) {
      const rootFolder = rootSearch.data.files[0];
      console.log(`✅ Carpeta raíz encontrada: ${rootFolder.name} (ID: ${rootFolder.id})`);
      
      // Test 3: Listar contenido de carpeta raíz
      console.log('\n📄 Listando carpetas de reservas...');
      const bookingFolders = await drive.files.list({
        q: `'${rootFolder.id}' in parents and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive',
        pageSize: 10
      });
      
      console.log(`✅ Se encontraron ${bookingFolders.data.files?.length || 0} carpetas de reservas`);
      
      if (bookingFolders.data.files && bookingFolders.data.files.length > 0) {
        console.log('\nPrimeras carpetas de reservas:');
        for (const folder of bookingFolders.data.files.slice(0, 3)) {
          console.log(`\n  📁 ${folder.name}`);
          
          // Listar contenido de la carpeta
          const folderContents = await drive.files.list({
            q: `'${folder.id}' in parents and trashed=false`,
            fields: 'files(id, name, mimeType)',
            spaces: 'drive'
          });
          
          if (folderContents.data.files && folderContents.data.files.length > 0) {
            console.log(`     ✅ ${folderContents.data.files.length} archivos dentro:`);
            folderContents.data.files.forEach(file => {
              console.log(`        - ${file.name}`);
            });
          } else {
            console.log('     ⚠️  VACÍA - Sin archivos');
          }
        }
      }
    } else {
      console.log('❌ No se encontró carpeta raíz "Reservas AlquiloScooter"');
    }
    
    console.log('\n✅ Test completado exitosamente');
    
  } catch (error) {
    console.error('\n❌ Error en test:', error.message);
    if (error.code === 401) {
      console.error('⚠️  TOKEN EXPIRADO - Ejecutar: oauth_token_manager(service="GOOGLEDRIVEUSER")');
    }
  }
}

testDrive();
