/**
 * Script para identificar y opcionalmente limpiar archivos de prueba en S3
 */

import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as readline from 'readline';

const s3Client = new S3Client({ region: 'us-west-2' });
const bucketName = process.env.AWS_BUCKET_NAME!;
const folderPrefix = process.env.AWS_FOLDER_PREFIX!;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

interface FileInfo {
  key: string;
  size: number;
  lastModified: Date;
}

/**
 * Lista todos los archivos en S3
 */
async function listAllFiles(): Promise<FileInfo[]> {
  const files: FileInfo[] = [];
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: folderPrefix,
      ContinuationToken: continuationToken,
    });

    const response = await s3Client.send(command);

    if (response.Contents) {
      files.push(...response.Contents.map(item => ({
        key: item.Key!,
        size: item.Size || 0,
        lastModified: item.LastModified || new Date(),
      })));
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return files;
}

/**
 * Identifica archivos de prueba (screenshots, duplicados, etc.)
 */
function identifyTestFiles(files: FileInfo[]): Map<string, FileInfo[]> {
  const testFileGroups = new Map<string, FileInfo[]>();

  // Agrupar por nombre base (sin timestamp)
  const grouped = new Map<string, FileInfo[]>();
  
  for (const file of files) {
    const fileName = file.key.split('/').pop() || '';
    
    // Identificar screenshots
    if (fileName.toLowerCase().includes('screenshot')) {
      const existing = testFileGroups.get('Screenshots de prueba') || [];
      existing.push(file);
      testFileGroups.set('Screenshots de prueba', existing);
      continue;
    }

    // Extraer nombre base sin timestamp
    const baseName = fileName.replace(/_\d{13,}_/, '_TIMESTAMP_');
    const existing = grouped.get(baseName) || [];
    existing.push(file);
    grouped.set(baseName, existing);
  }

  // Identificar duplicados (más de 3 versiones del mismo archivo)
  for (const [baseName, fileList] of grouped.entries()) {
    if (fileList.length > 3) {
      // Ordenar por fecha, mantener los 3 más recientes
      fileList.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
      const oldVersions = fileList.slice(3);
      
      if (oldVersions.length > 0) {
        testFileGroups.set(`Versiones antiguas de: ${baseName}`, oldVersions);
      }
    }
  }

  return testFileGroups;
}

/**
 * Muestra un resumen de archivos de prueba
 */
function showSummary(testFileGroups: Map<string, FileInfo[]>): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE ARCHIVOS DE PRUEBA EN S3');
  console.log('='.repeat(60) + '\n');

  let totalFiles = 0;
  let totalSize = 0;

  for (const [category, files] of testFileGroups.entries()) {
    const categorySize = files.reduce((sum, f) => sum + f.size, 0);
    const sizeMB = (categorySize / (1024 * 1024)).toFixed(2);
    
    console.log(`📁 ${category}`);
    console.log(`   Archivos: ${files.length}`);
    console.log(`   Tamaño: ${sizeMB} MB`);
    console.log('');

    totalFiles += files.length;
    totalSize += categorySize;
  }

  console.log('─'.repeat(60));
  console.log(`Total: ${totalFiles} archivos, ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log('='.repeat(60) + '\n');
}

/**
 * Elimina archivos de S3
 */
async function deleteFiles(files: FileInfo[]): Promise<void> {
  let deleted = 0;
  let errors = 0;

  for (const file of files) {
    try {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: file.key,
      }));
      deleted++;
      process.stdout.write(`\r   Eliminados: ${deleted}/${files.length}`);
    } catch (error) {
      errors++;
      console.error(`\n   ❌ Error al eliminar ${file.key}: ${error}`);
    }
  }

  console.log(`\n   ✅ ${deleted} archivos eliminados`);
  if (errors > 0) {
    console.log(`   ⚠️  ${errors} errores`);
  }
}

/**
 * Función principal
 */
async function main() {
  try {
    console.log('🔍 Analizando archivos en S3...\n');
    console.log(`   Bucket: ${bucketName}`);
    console.log(`   Prefix: ${folderPrefix}\n`);

    const allFiles = await listAllFiles();
    console.log(`✅ Se encontraron ${allFiles.length} archivos\n`);

    const testFileGroups = identifyTestFiles(allFiles);

    if (testFileGroups.size === 0) {
      console.log('✅ No se encontraron archivos de prueba para limpiar');
      rl.close();
      return;
    }

    showSummary(testFileGroups);

    const answer = await question('¿Desea eliminar estos archivos? (si/no): ');

    if (answer.toLowerCase() === 'si' || answer.toLowerCase() === 's') {
      console.log('\n🗑️  Eliminando archivos...\n');

      for (const [category, files] of testFileGroups.entries()) {
        console.log(`📁 ${category}`);
        await deleteFiles(files);
        console.log('');
      }

      console.log('✅ Limpieza completada');
    } else {
      console.log('ℹ️  Operación cancelada');
    }

    rl.close();

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

main();
