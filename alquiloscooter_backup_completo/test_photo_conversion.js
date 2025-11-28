
require('dotenv').config();
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({});
const bucketName = process.env.AWS_BUCKET_NAME;
const folderPrefix = process.env.AWS_FOLDER_PREFIX || '';

async function getFileAsBase64(key) {
  try {
    console.log('🔍 Intentando descargar:', key);
    console.log('   Bucket:', bucketName);
    console.log('   Folder prefix:', folderPrefix);
    
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      console.log('❌ response.Body es null');
      return null;
    }

    // Convertir el stream a buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Determinar el tipo MIME basado en la extensión del archivo
    const extension = key.split('.').pop()?.toLowerCase();
    let mimeType = 'image/png'; // default
    if (extension === 'jpg' || extension === 'jpeg') {
      mimeType = 'image/jpeg';
    } else if (extension === 'png') {
      mimeType = 'image/png';
    }

    // Convertir a base64
    const base64 = buffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('❌ Error downloading file from S3:', error.message);
    return null;
  }
}

async function testPhoto() {
  const photoPath = '5155/expedientes/202511070001/inspecciones/front-1731009695776.jpg';
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 TEST DE CONVERSIÓN DE FOTO A BASE64');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const result = await getFileAsBase64(photoPath);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (result) {
    console.log('✅ ÉXITO: Foto convertida a base64');
    console.log('   Longitud:', result.length, 'caracteres');
    console.log('   Primeros 100 chars:', result.substring(0, 100));
  } else {
    console.log('❌ ERROR: getFileAsBase64 retornó null');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

testPhoto();
