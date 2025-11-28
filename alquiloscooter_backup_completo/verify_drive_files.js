const fs = require('fs');
const { google } = require('googleapis');

function getAccessToken() {
  try {
    const secretsPath = '/home/ubuntu/.config/abacusai_auth_secrets.json';
    const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
    return secrets.GOOGLEDRIVEUSER?.secrets?.access_token?.value || 
           secrets.googledriveuser?.secrets?.access_token?.value || '';
  } catch (error) {
    console.error('Error leyendo token:', error);
    return '';
  }
}

function getDriveClient() {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error('No se encontró token');
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: 'v3', auth });
}

async function verifyDriveFiles() {
  try {
    console.log('📂 Verificando archivos en Google Drive para reserva 202510260001\n');
    
    const drive = getDriveClient();
    
    // Buscar carpeta raíz
    const rootResponse = await drive.files.list({
      q: `name='Reservas AlquiloScooter' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });
    
    const rootId = rootResponse.data.files[0].id;
    
    // Buscar carpeta de reserva
    const bookingResponse = await drive.files.list({
      q: `name contains '202510260001' and '${rootId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });
    
    const folderId = bookingResponse.data.files[0].id;
    const folderName = bookingResponse.data.files[0].name;
    
    console.log(`✅ Carpeta: ${folderName}\n`);
    
    // Listar TODOS los archivos
    const filesResponse = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, size, createdTime)',
      orderBy: 'name',
      spaces: 'drive'
    });
    
    const files = filesResponse.data.files || [];
    
    console.log(`📁 Total de archivos: ${files.length}\n`);
    
    // Clasificar archivos
    const photos = files.filter(f => f.mimeType.startsWith('image/'));
    const pdfs = files.filter(f => f.mimeType === 'application/pdf');
    const others = files.filter(f => !f.mimeType.startsWith('image/') && f.mimeType !== 'application/pdf');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMEN POR TIPO:\n');
    console.log(`   📸 Fotos: ${photos.length}`);
    console.log(`   📄 PDFs: ${pdfs.length}`);
    console.log(`   📁 Otros: ${others.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (pdfs.length > 0) {
      console.log('📄 PDFS ENCONTRADOS:\n');
      pdfs.forEach((file, idx) => {
        console.log(`   ${idx+1}. ${file.name}`);
        console.log(`      Tamaño: ${(parseInt(file.size) / 1024).toFixed(2)} KB`);
        console.log(`      Fecha: ${file.createdTime}\n`);
      });
    }
    
    if (photos.length > 0) {
      console.log('📸 FOTOS ENCONTRADAS:\n');
      photos.forEach((file, idx) => {
        console.log(`   ${idx+1}. ${file.name}`);
        console.log(`      Tamaño: ${(parseInt(file.size) / 1024).toFixed(2)} KB`);
        console.log(`      Fecha: ${file.createdTime}\n`);
      });
    }
    
    if (others.length > 0) {
      console.log('📁 OTROS ARCHIVOS:\n');
      others.forEach((file, idx) => {
        console.log(`   ${idx+1}. ${file.name} (${file.mimeType})`);
      });
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 ANÁLISIS:\n');
    
    // Análisis de duplicación
    if (photos.length > 0 && pdfs.length > 0) {
      console.log('⚠️  Se están subiendo FOTOS + PDFs');
      console.log('   → Los PDFs de inspección YA contienen las fotos');
      console.log('   → Esto genera duplicación innecesaria\n');
    }
    
    // Análisis de contratos
    const contratosPDF = pdfs.filter(f => f.name.toLowerCase().includes('contrato'));
    const inspeccionesPDF = pdfs.filter(f => f.name.toLowerCase().includes('inspeccion'));
    
    console.log(`📄 Contratos: ${contratosPDF.length}`);
    console.log(`📄 Inspecciones: ${inspeccionesPDF.length}`);
    console.log(`📸 Fotos sueltas: ${photos.length}\n`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyDriveFiles();
