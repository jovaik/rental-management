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

async function listFilesInFolder(drive, folderId) {
  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, createdTime, size)',
      spaces: 'drive',
      pageSize: 100
    });
    return response.data.files || [];
  } catch (error) {
    return [];
  }
}

async function checkDuplicates() {
  try {
    const drive = getDriveClient();
    console.log('🔍 ANÁLISIS DE DUPLICADOS EN GOOGLE DRIVE\n');
    console.log('═'.repeat(80));
    
    // Obtener carpetas problemáticas
    const problemBookings = await prisma.carRentalBookings.findMany({
      where: {
        booking_number: { in: ['202510260001', '202510240001', '202510260002'] }
      },
      select: {
        id: true,
        booking_number: true,
        google_drive_folder_id: true,
        google_drive_folder_url: true
      }
    });
    
    console.log(`📊 Analizando ${problemBookings.length} carpetas\n`);
    
    for (const booking of problemBookings) {
      console.log(`\n📁 ${booking.booking_number}`);
      console.log(`   URL: ${booking.google_drive_folder_url}`);
      
      if (!booking.google_drive_folder_id) {
        console.log('   ⚠️  Sin carpeta de Drive');
        continue;
      }
      
      const files = await listFilesInFolder(drive, booking.google_drive_folder_id);
      console.log(`   📋 Total archivos: ${files.length}`);
      
      // Agrupar por nombre
      const filesByName = {};
      for (const file of files) {
        if (!filesByName[file.name]) {
          filesByName[file.name] = [];
        }
        filesByName[file.name].push(file);
      }
      
      // Identificar duplicados
      const duplicates = Object.entries(filesByName).filter(([name, instances]) => instances.length > 1);
      
      if (duplicates.length > 0) {
        console.log(`\n   ⚠️  DUPLICADOS ENCONTRADOS: ${duplicates.length}\n`);
        for (const [name, instances] of duplicates) {
          console.log(`      📄 ${name} (${instances.length} copias)`);
          for (const [index, file] of instances.entries()) {
            const date = new Date(file.createdTime).toLocaleString('es-ES');
            const size = file.size ? `${Math.round(file.size/1024)}KB` : 'N/A';
            console.log(`         ${index+1}. Creado: ${date} | Tamaño: ${size} | ID: ${file.id}`);
          }
        }
      } else {
        console.log('   ✅ Sin duplicados');
      }
      
      // Listar todos los archivos
      console.log(`\n   📋 LISTA COMPLETA:`);
      const sortedFiles = files.sort((a, b) => a.name.localeCompare(b.name));
      for (const file of sortedFiles) {
        console.log(`      - ${file.name}`);
      }
    }
    
    console.log('\n' + '═'.repeat(80));
    await prisma.$disconnect();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkDuplicates();
