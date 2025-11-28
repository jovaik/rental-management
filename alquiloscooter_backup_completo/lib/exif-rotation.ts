
/**
 * Rotación automática de imágenes según metadatos EXIF
 * Detecta la orientación de la cámara y corrige la visualización
 */

interface RotationResult {
  canvas: HTMLCanvasElement;
  blob: Blob;
}

/**
 * Lee la orientación EXIF de una imagen y la rota correctamente
 */
export async function rotateImageIfNeeded(file: File): Promise<File> {
  try {
    console.log('📸 Iniciando verificación EXIF para:', file.name, 'Tipo:', file.type);
    
    // Leer orientación EXIF
    const orientation = await getImageOrientation(file);
    console.log('📐 Orientación EXIF detectada:', orientation);
    
    // Si la imagen ya está correctamente orientada, devolverla sin cambios
    if (orientation === 1 || orientation === -2 || orientation === -1) {
      console.log('✅ Imagen ya correctamente orientada o sin EXIF:', orientation);
      return file;
    }

    console.log('🔄 ROTANDO imagen con orientación EXIF:', orientation);
    
    // Cargar imagen
    const img = await loadImage(file);
    
    // Crear canvas con dimensiones apropiadas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('No se pudo crear contexto del canvas');
    }

    // Calcular dimensiones según orientación
    if (orientation >= 5 && orientation <= 8) {
      // 90° o 270° - intercambiar ancho/alto
      canvas.width = img.height;
      canvas.height = img.width;
    } else {
      canvas.width = img.width;
      canvas.height = img.height;
    }

    // Aplicar transformación según orientación EXIF
    switch (orientation) {
      case 2:
        // Espejo horizontal
        ctx.transform(-1, 0, 0, 1, canvas.width, 0);
        break;
      case 3:
        // 180°
        ctx.transform(-1, 0, 0, -1, canvas.width, canvas.height);
        break;
      case 4:
        // Espejo vertical
        ctx.transform(1, 0, 0, -1, 0, canvas.height);
        break;
      case 5:
        // Espejo horizontal + 90° CCW
        ctx.transform(0, 1, 1, 0, 0, 0);
        break;
      case 6:
        // 90° CW
        ctx.transform(0, 1, -1, 0, canvas.height, 0);
        break;
      case 7:
        // Espejo horizontal + 90° CW
        ctx.transform(0, -1, -1, 0, canvas.height, canvas.width);
        break;
      case 8:
        // 90° CCW
        ctx.transform(0, -1, 1, 0, 0, canvas.width);
        break;
      default:
        // Sin transformación
        break;
    }

    // Dibujar imagen rotada
    ctx.drawImage(img, 0, 0);

    // Convertir a blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('Error al convertir canvas a blob'));
      }, file.type, 0.92);
    });

    // Crear nuevo File con el mismo nombre
    const rotatedFile = new File([blob], file.name, {
      type: file.type,
      lastModified: Date.now()
    });

    console.log('✅ Imagen rotada correctamente');
    return rotatedFile;

  } catch (error) {
    console.error('❌ Error al rotar imagen:', error);
    // Si falla, devolver imagen original
    return file;
  }
}

/**
 * Obtiene la orientación EXIF de una imagen
 */
async function getImageOrientation(file: File): Promise<number> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const view = new DataView(e.target?.result as ArrayBuffer);
      
      // Verificar si es JPEG (FF D8 FF)
      if (view.getUint16(0, false) !== 0xFFD8) {
        resolve(-2); // No es JPEG
        return;
      }

      const length = view.byteLength;
      let offset = 2;

      while (offset < length) {
        // Verificar marcador de segmento
        if (view.getUint16(offset + 2, false) <= 8) {
          resolve(-1); // EXIF inválido
          return;
        }
        
        const marker = view.getUint16(offset, false);
        offset += 2;

        // Buscar marcador APP1 (FFE1) que contiene EXIF
        if (marker === 0xFFE1) {
          // Verificar header EXIF
          if (view.getUint32(offset += 2, false) !== 0x45786966) {
            resolve(-1);
            return;
          }

          const little = view.getUint16(offset += 6, false) === 0x4949;
          offset += view.getUint32(offset + 4, little);
          const tags = view.getUint16(offset, little);
          offset += 2;

          // Buscar tag de orientación (0x0112)
          for (let i = 0; i < tags; i++) {
            if (view.getUint16(offset + (i * 12), little) === 0x0112) {
              const orientation = view.getUint16(offset + (i * 12) + 8, little);
              resolve(orientation);
              return;
            }
          }
        } else if ((marker & 0xFF00) !== 0xFF00) {
          break;
        } else {
          offset += view.getUint16(offset, false);
        }
      }
      
      resolve(-1); // No se encontró orientación EXIF
    };

    reader.onerror = () => resolve(-1);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Carga una imagen desde un File
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
