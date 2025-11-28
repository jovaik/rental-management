import { google } from 'googleapis';
import fs from 'fs';

async function testDrive() {
  try {
    console.log('🔐 Verificando token de Google Drive...\n');
    
    const secretsPath = '/home/ubuntu/.config/abacusai_auth_secrets.json';
    const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
    const token = secrets.googledriveuser?.secrets?.access_token?.value;
    
    if (!token) {
      console.log('❌ No se encontró token');
      return;
    }
    
    console.log('✅ Token encontrado:', token.substring(0, 20) + '...');
    
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: token });
    const drive = google.drive({ version: 'v3', auth });
    
    console.log('\n📁 Intentando listar carpetas en Drive...');
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id, name)',
      pageSize: 5
    });
    
    console.log('\n✅ Conexión exitosa con Google Drive!');
    console.log('Carpetas encontradas:', response.data.files?.length || 0);
    
    if (response.data.files && response.data.files.length > 0) {
      console.log('\nEjemplo de carpetas:');
      response.data.files.forEach(file => {
        console.log(`  - ${file.name} (${file.id})`);
      });
    }
    
    console.log('\n✅ Google Drive funciona correctamente');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 401) {
      console.error('⚠️ Token expirado o inválido. Necesita re-autenticación.');
    }
  }
}

testDrive();
