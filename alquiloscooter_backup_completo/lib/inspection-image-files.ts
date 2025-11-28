
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface InspectionImageFiles {
  front?: string;
  left?: string;
  rear?: string;
  right?: string;
  odometer?: string;
}

/**
 * Guarda buffers de imágenes de inspección como ficheros temporales .jpg
 * y devuelve sus rutas absolutas.
 */
export async function saveInspectionImagesToTempFiles(
  inspectionId: number,
  images: {
    frontImg?: Buffer;
    leftImg?: Buffer;
    rearImg?: Buffer;
    rightImg?: Buffer;
    odometerImg?: Buffer;
  }
): Promise<InspectionImageFiles> {
  const tmpDir = os.tmpdir(); // normalmente /tmp en Linux
  const prefix = `inspection-${inspectionId}`;

  const files: InspectionImageFiles = {};

  async function saveIfPresent(
    buf: Buffer | undefined,
    suffix: string
  ): Promise<string | undefined> {
    if (!buf) return undefined;
    const filePath = path.join(tmpDir, `${prefix}-${suffix}.jpg`);
    await fs.promises.writeFile(filePath, buf);
    return filePath;
  }

  files.front = await saveIfPresent(images.frontImg, 'front');
  files.left = await saveIfPresent(images.leftImg, 'left');
  files.rear = await saveIfPresent(images.rearImg, 'rear');
  files.right = await saveIfPresent(images.rightImg, 'right');
  files.odometer = await saveIfPresent(images.odometerImg, 'odometer');

  return files;
}

/**
 * Elimina los ficheros temporales de imágenes de inspección.
 */
export async function cleanupInspectionImageFiles(files: InspectionImageFiles): Promise<void> {
  const paths = Object.values(files).filter((p): p is string => !!p);
  await Promise.all(
    paths.map(async (filePath) => {
      try {
        await fs.promises.unlink(filePath);
      } catch (err) {
        // Si ya no existe, no pasa nada
        console.warn(`⚠️ [Cleanup] No se pudo borrar ${filePath}:`, (err as any).message);
      }
    })
  );
}
