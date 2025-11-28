require('dotenv').config();
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

async function checkS3Photos() {
  const s3 = new S3Client({});
  const bucketName = process.env.AWS_BUCKET_NAME;
  const folderPrefix = process.env.AWS_FOLDER_PREFIX || '';
  
  console.log('\n🔍 Buscando fotos de inspecciones en S3...');
  console.log('  Bucket:', bucketName);
  console.log('  Prefix:', folderPrefix);
  
  try {
    // Buscar fotos que contengan "inspection" en el nombre
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: `${folderPrefix}inspections/`,
      MaxKeys: 100
    });
    
    const response = await s3.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      console.log('\n❌ No se encontraron fotos de inspecciones en S3');
      return;
    }
    
    console.log(`\n✅ Se encontraron ${response.Contents.length} archivos en S3:`);
    
    // Filtrar solo los relacionados con booking 120 o vehicle 94
    const relevantFiles = response.Contents.filter(file => 
      file.Key.includes('120') || file.Key.includes('94') || file.Key.includes('inspection')
    );
    
    relevantFiles.forEach(file => {
      const size = (file.Size / 1024).toFixed(2);
      console.log(`  📷 ${file.Key} (${size} KB)`);
    });
    
  } catch (error) {
    console.error('❌ Error al listar S3:', error.message);
  }
}

checkS3Photos();
