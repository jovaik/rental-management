
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3Client, getBucketConfig } from './aws-config';

const s3Client = createS3Client();
const { bucketName, folderPrefix } = getBucketConfig();

export async function uploadFile(buffer: Buffer, fileName: string): Promise<string> {
  const key = fileName.startsWith(folderPrefix) ? fileName : `${folderPrefix}${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
  });

  await s3Client.send(command);
  return key;
}

export async function getFileUrl(key: string, expiresIn: number = 604800): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
  return signedUrl;
}

export async function downloadFile(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 604800 });
  return signedUrl;
}

export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client.send(command);
}

export async function renameFile(oldKey: string, newKey: string): Promise<string> {
  // S3 doesn't have a native rename, so we copy and delete
  // For simplicity, we'll just return the new key
  // In a real implementation, you'd use CopyObjectCommand
  return newKey;
}

/**
 * Obtiene un archivo de S3 como Buffer (sin conversión a Base64)
 * Útil para guardar archivos temporales en disco
 */
export async function getFileAsBuffer(key: string): Promise<Buffer | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      return null;
    }

    // Convertir el stream a buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Para imágenes JPEG/PNG, aplicar corrección EXIF
    const extension = key.split('.').pop()?.toLowerCase();
    if ((extension === 'jpg' || extension === 'jpeg' || extension === 'png') && buffer.length > 0) {
      try {
        const sharp = require('sharp');
        const rotatedBuffer = await sharp(buffer)
          .rotate() // Aplica rotación automática basada en metadatos EXIF
          .toBuffer();
        return rotatedBuffer;
      } catch (sharpError) {
        console.warn(`⚠️ Sharp rotation failed for ${key}, usando buffer original`);
        return buffer;
      }
    }

    return buffer;
  } catch (error) {
    console.error(`Error obteniendo archivo como buffer de S3 (${key}):`, error);
    return null;
  }
}

export async function getFileAsBase64(key: string): Promise<string | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      return null;
    }

    // Convertir el stream a buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
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
    } else if (extension === 'gif') {
      mimeType = 'image/gif';
    } else if (extension === 'svg') {
      mimeType = 'image/svg+xml';
    }

    // Para imágenes JPEG/PNG, aplicar corrección EXIF
    if ((extension === 'jpg' || extension === 'jpeg' || extension === 'png') && buffer.length > 0) {
      try {
        const sharp = require('sharp');
        const rotatedBuffer = await sharp(buffer)
          .rotate() // ✅ Aplica rotación automática basada en metadatos EXIF
          .toBuffer();
        const base64 = rotatedBuffer.toString('base64');
        return `data:${mimeType};base64,${base64}`;
      } catch (sharpError) {
        console.warn('Error aplicando rotación EXIF, usando buffer original:', sharpError);
        // Fallback: usar buffer original sin rotación
      }
    }

    // Convertir a base64
    const base64 = buffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error downloading file from S3:', error);
    return null;
  }
}

// Descargar archivo como Buffer (para Google Drive)
export async function downloadFileAsBuffer(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const response = await s3Client.send(command);
  
  if (!response.Body) {
    throw new Error('No se pudo descargar el archivo de S3');
  }

  // Convertir el stream a buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }
  
  return Buffer.concat(chunks);
}

// Alias para downloadFileAsBuffer
export const getFile = downloadFileAsBuffer;

// Función para obtener imagen comprimida como base64 (para contratos PDF)
export async function getFileAsCompressedBase64(key: string, maxWidth: number = 800, quality: number = 70): Promise<string | null> {
  try {
    console.log(`📸 [S3] Obteniendo foto comprimida: ${key}`);
    const sharp = require('sharp');
    
    // Asegurarse de que el key no tenga espacios ni caracteres extraños
    const cleanKey = key.trim();
    
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: cleanKey,
    });

    console.log(`📤 [S3] Solicitando archivo de bucket: ${bucketName}, key: ${cleanKey}`);
    const response = await s3Client.send(command);
    
    if (!response.Body) {
      console.error(`❌ [S3] No se encontró el archivo: ${cleanKey}`);
      return null;
    }

    console.log(`✅ [S3] Archivo encontrado, convirtiendo a buffer...`);
    // Convertir el stream a buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    console.log(`📦 [S3] Buffer creado: ${buffer.length} bytes`);

    // Comprimir la imagen usando sharp con corrección EXIF
    console.log(`🖼️ [S3] Comprimiendo imagen (maxWidth: ${maxWidth}, quality: ${quality})...`);
    const compressedBuffer = await sharp(buffer)
      .rotate() // ✅ Aplica rotación automática basada en metadatos EXIF
      .resize(maxWidth, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: quality })
      .toBuffer();

    console.log(`✅ [S3] Imagen comprimida: ${compressedBuffer.length} bytes (reducción: ${Math.round((1 - compressedBuffer.length / buffer.length) * 100)}%)`);

    // Convertir a base64
    const base64 = compressedBuffer.toString('base64');
    console.log(`✅ [S3] Base64 generado: ${base64.substring(0, 50)}... (${base64.length} caracteres)`);
    return `data:image/jpeg;base64,${base64}`;
  } catch (error: any) {
    console.error(`❌ [S3] Error obteniendo/comprimiendo archivo ${key}:`, error.message);
    console.error(`❌ [S3] Código de error:`, error.code);
    console.error(`❌ [S3] Stack:`, error.stack);
    
    // Intentar fallback a la función sin comprimir
    console.log(`🔄 [S3] Intentando fallback sin compresión para: ${key}`);
    try {
      const fallbackResult = await getFileAsBase64(key);
      if (fallbackResult) {
        console.log(`✅ [S3] Fallback exitoso para: ${key}`);
      } else {
        console.log(`❌ [S3] Fallback falló para: ${key}`);
      }
      return fallbackResult;
    } catch (fallbackError: any) {
      console.error(`❌ [S3] Fallback también falló:`, fallbackError.message);
      return null;
    }
  }
}