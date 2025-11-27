// Utilidades para subida de archivos
import { v4 as uuidv4 } from 'uuid';

// Configuración de AWS S3 (opcional)
const AWS_REGION = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;

// Verificar si AWS está configurado
export const isS3Configured = Boolean(
  AWS_REGION &&
  AWS_ACCESS_KEY_ID &&
  AWS_SECRET_ACCESS_KEY &&
  AWS_BUCKET_NAME
);

/**
 * Subir archivo a S3 o almacenar localmente según configuración
 */
export async function uploadFile({
  file,
  tenantId,
  folder,
}: {
  file: File;
  tenantId: string;
  folder: string;
}): Promise<string> {
  const fileName = `${uuidv4()}-${file.name}`;
  const filePath = `tenant-${tenantId}/${folder}/${fileName}`;

  if (isS3Configured) {
    // Subir a S3
    return await uploadToS3(file, filePath);
  } else {
    // Almacenar localmente para desarrollo
    return await uploadLocally(file, filePath);
  }
}

/**
 * Subir archivo a AWS S3
 */
async function uploadToS3(file: File, path: string): Promise<string> {
  // Importación dinámica de AWS SDK
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

  const s3Client = new S3Client({
    region: AWS_REGION!,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID!,
      secretAccessKey: AWS_SECRET_ACCESS_KEY!,
    },
  });

  const buffer = Buffer.from(await file.arrayBuffer());

  const command = new PutObjectCommand({
    Bucket: AWS_BUCKET_NAME!,
    Key: path,
    Body: buffer,
    ContentType: file.type,
  });

  await s3Client.send(command);

  // Retornar URL pública
  return `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${path}`;
}

/**
 * Almacenar archivo localmente (para desarrollo)
 */
async function uploadLocally(file: File, path: string): Promise<string> {
  const fs = await import('fs/promises');
  const pathModule = await import('path');

  // Crear directorio si no existe
  const uploadDir = pathModule.join(process.cwd(), 'public', 'uploads');
  const fullPath = pathModule.join(uploadDir, path);
  const dir = pathModule.dirname(fullPath);

  await fs.mkdir(dir, { recursive: true });

  // Guardar archivo
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(fullPath, buffer);

  // Retornar URL relativa
  return `/uploads/${path}`;
}

/**
 * Validar tipo de archivo (imágenes)
 */
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
}

/**
 * Validar tamaño de archivo (máximo 5MB)
 */
export function isValidFileSize(file: File, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}
