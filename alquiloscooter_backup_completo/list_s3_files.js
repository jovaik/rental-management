
require('dotenv').config();
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({});
const bucketName = process.env.AWS_BUCKET_NAME;
const folderPrefix = process.env.AWS_FOLDER_PREFIX || '';

async function listFiles() {
  const prefix = '5155/expedientes/202511070001/';
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📁 LISTADO DE ARCHIVOS EN S3');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Bucket:', bucketName);
  console.log('Prefix:', prefix);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      MaxKeys: 100
    });

    const response = await s3Client.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      console.log('❌ NO SE ENCONTRARON ARCHIVOS');
      return;
    }
    
    console.log(`✅ Se encontraron ${response.Contents.length} archivos:\n`);
    response.Contents.forEach((item, i) => {
      console.log(`${i+1}. ${item.Key}`);
      console.log(`   Tamaño: ${(item.Size / 1024).toFixed(2)} KB`);
      console.log(`   Fecha: ${item.LastModified}\n`);
    });
    
  } catch (error) {
    console.error('❌ Error listando archivos:', error.message);
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

listFiles();
