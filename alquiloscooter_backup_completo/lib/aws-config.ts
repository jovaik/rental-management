
import { S3Client } from '@aws-sdk/client-s3';

export function getBucketConfig() {
  return {
    bucketName: process.env.AWS_BUCKET_NAME || '',
    folderPrefix: process.env.AWS_FOLDER_PREFIX || '',
  };
}

export function createS3Client() {
  const config: any = {};
  
  // Añadir región si está disponible
  if (process.env.AWS_REGION) {
    config.region = process.env.AWS_REGION;
  }
  
  // Priorizar credenciales de Abacus.AI (ABACUS_AWS_*)
  const accessKeyId = process.env.ABACUS_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.ABACUS_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = process.env.ABACUS_AWS_SESSION_TOKEN || process.env.AWS_SESSION_TOKEN;
  
  if (accessKeyId && secretAccessKey) {
    config.credentials = {
      accessKeyId,
      secretAccessKey,
    };
    
    // Añadir session token si está disponible (necesario para credenciales temporales)
    if (sessionToken) {
      config.credentials.sessionToken = sessionToken;
    }
  }
  
  return new S3Client(config);
}
