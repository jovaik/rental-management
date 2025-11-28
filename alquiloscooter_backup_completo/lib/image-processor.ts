
/**
 * Procesador automático de imágenes de documentos
 * Detecta bordes, corrige perspectiva y recorta automáticamente
 */

interface Point {
  x: number;
  y: number;
}

interface Rectangle {
  topLeft: Point;
  topRight: Point;
  bottomLeft: Point;
  bottomRight: Point;
}

export class DocumentImageProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo obtener contexto 2D');
    this.ctx = ctx;
  }

  /**
   * Procesa automáticamente una imagen de documento
   */
  async processDocument(imageFile: File): Promise<Blob> {
    const img = await this.loadImage(imageFile);
    
    // Configurar canvas con el tamaño de la imagen
    this.canvas.width = img.width;
    this.canvas.height = img.height;
    this.ctx.drawImage(img, 0, 0);

    // Obtener datos de la imagen
    const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
    
    // Detectar el documento
    const docRect = this.detectDocument(imageData);
    
    if (!docRect) {
      // Si no se detecta, devolver la imagen con un recorte básico (eliminar 10% de bordes)
      return this.basicCrop(img);
    }

    // Aplicar transformación de perspectiva
    const processed = this.perspectiveTransform(img, docRect);
    
    return processed;
  }

  /**
   * Carga una imagen desde un File
   */
  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Error al cargar la imagen'));
      };
      
      img.src = url;
    });
  }

  /**
   * Detecta automáticamente los bordes del documento
   */
  private detectDocument(imageData: ImageData): Rectangle | null {
    const { width, height, data } = imageData;
    
    // Convertir a escala de grises
    const gray = new Uint8ClampedArray(width * height);
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      gray[i / 4] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    }

    // Aplicar threshold adaptativo para binarizar
    const binary = this.adaptiveThreshold(gray, width, height);
    
    // Detectar bordes con Sobel
    const edges = this.sobelEdgeDetection(binary, width, height);
    
    // Encontrar el contorno más grande (asumiendo que es el documento)
    const corners = this.findLargestRectangle(edges, width, height);
    
    return corners;
  }

  /**
   * Threshold adaptativo
   */
  private adaptiveThreshold(gray: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
    const result = new Uint8ClampedArray(gray.length);
    const blockSize = 15;
    const C = 10;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let count = 0;
        
        for (let by = Math.max(0, y - blockSize); by < Math.min(height, y + blockSize); by++) {
          for (let bx = Math.max(0, x - blockSize); bx < Math.min(width, x + blockSize); bx++) {
            sum += gray[by * width + bx];
            count++;
          }
        }
        
        const threshold = (sum / count) - C;
        const idx = y * width + x;
        result[idx] = gray[idx] > threshold ? 255 : 0;
      }
    }
    
    return result;
  }

  /**
   * Detección de bordes Sobel
   */
  private sobelEdgeDetection(image: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
    const result = new Uint8ClampedArray(image.length);
    
    const sobelX = [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1]
    ];
    
    const sobelY = [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1]
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0;
        let gy = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = (y + ky) * width + (x + kx);
            gx += image[idx] * sobelX[ky + 1][kx + 1];
            gy += image[idx] * sobelY[ky + 1][kx + 1];
          }
        }
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        result[y * width + x] = Math.min(255, magnitude);
      }
    }
    
    return result;
  }

  /**
   * Encuentra el rectángulo más grande en la imagen de bordes
   */
  private findLargestRectangle(edges: Uint8ClampedArray, width: number, height: number): Rectangle | null {
    // Buscar las esquinas del documento
    // Dividir la imagen en 4 cuadrantes y buscar puntos con mayor intensidad de borde
    
    const margin = 0.1; // 10% de margen
    const mx = Math.floor(width * margin);
    const my = Math.floor(height * margin);
    
    // Por simplicidad, asumir que el documento ocupa la mayor parte de la imagen
    // y buscar las esquinas en cada cuadrante
    
    const topLeft = this.findCorner(edges, width, height, 0, 0, width / 2, height / 2, 'topLeft');
    const topRight = this.findCorner(edges, width, height, width / 2, 0, width, height / 2, 'topRight');
    const bottomLeft = this.findCorner(edges, width, height, 0, height / 2, width / 2, height, 'bottomLeft');
    const bottomRight = this.findCorner(edges, width, height, width / 2, height / 2, width, height, 'bottomRight');
    
    if (!topLeft || !topRight || !bottomLeft || !bottomRight) {
      return null;
    }
    
    return { topLeft, topRight, bottomLeft, bottomRight };
  }

  /**
   * Encuentra una esquina en un cuadrante específico
   */
  private findCorner(
    edges: Uint8ClampedArray, 
    width: number, 
    height: number,
    x1: number, 
    y1: number, 
    x2: number, 
    y2: number,
    corner: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
  ): Point | null {
    let maxScore = 0;
    let bestPoint: Point | null = null;
    
    const stepSize = 5; // Para optimizar, no revisar cada pixel
    
    for (let y = Math.floor(y1); y < Math.floor(y2); y += stepSize) {
      for (let x = Math.floor(x1); x < Math.floor(x2); x += stepSize) {
        const idx = y * width + x;
        const score = edges[idx];
        
        if (score > maxScore) {
          maxScore = score;
          bestPoint = { x, y };
        }
      }
    }
    
    // Si no encontramos un punto fuerte, usar las esquinas del cuadrante
    if (!bestPoint || maxScore < 50) {
      switch (corner) {
        case 'topLeft':
          return { x: Math.floor(x1), y: Math.floor(y1) };
        case 'topRight':
          return { x: Math.floor(x2), y: Math.floor(y1) };
        case 'bottomLeft':
          return { x: Math.floor(x1), y: Math.floor(y2) };
        case 'bottomRight':
          return { x: Math.floor(x2), y: Math.floor(y2) };
      }
    }
    
    return bestPoint;
  }

  /**
   * Aplica transformación de perspectiva
   */
  private perspectiveTransform(img: HTMLImageElement, rect: Rectangle): Promise<Blob> {
    // Calcular el ancho y alto del documento enderezado
    const widthA = Math.sqrt(
      Math.pow(rect.bottomRight.x - rect.bottomLeft.x, 2) +
      Math.pow(rect.bottomRight.y - rect.bottomLeft.y, 2)
    );
    const widthB = Math.sqrt(
      Math.pow(rect.topRight.x - rect.topLeft.x, 2) +
      Math.pow(rect.topRight.y - rect.topLeft.y, 2)
    );
    const maxWidth = Math.max(widthA, widthB);

    const heightA = Math.sqrt(
      Math.pow(rect.topRight.x - rect.bottomRight.x, 2) +
      Math.pow(rect.topRight.y - rect.bottomRight.y, 2)
    );
    const heightB = Math.sqrt(
      Math.pow(rect.topLeft.x - rect.bottomLeft.x, 2) +
      Math.pow(rect.topLeft.y - rect.bottomLeft.y, 2)
    );
    const maxHeight = Math.max(heightA, heightB);

    // Crear canvas para el resultado
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = maxWidth;
    outputCanvas.height = maxHeight;
    const outputCtx = outputCanvas.getContext('2d');
    
    if (!outputCtx) throw new Error('No se pudo crear contexto de salida');

    // Aplicar transformación usando drawImage con 8 parámetros para simular perspectiva
    // Nota: Canvas 2D no soporta transformación de perspectiva completa,
    // así que haremos una aproximación usando el recorte del área
    
    // Calcular el rectángulo delimitador
    const minX = Math.min(rect.topLeft.x, rect.topRight.x, rect.bottomLeft.x, rect.bottomRight.x);
    const minY = Math.min(rect.topLeft.y, rect.topRight.y, rect.bottomLeft.y, rect.bottomRight.y);
    const maxX = Math.max(rect.topLeft.x, rect.topRight.x, rect.bottomLeft.x, rect.bottomRight.x);
    const maxY = Math.max(rect.topLeft.y, rect.topRight.y, rect.bottomLeft.y, rect.bottomRight.y);
    
    const cropWidth = maxX - minX;
    const cropHeight = maxY - minY;
    
    // Dibujar la región recortada escalada al tamaño objetivo
    outputCtx.drawImage(
      img,
      minX, minY, cropWidth, cropHeight,
      0, 0, maxWidth, maxHeight
    );

    return new Promise((resolve) => {
      outputCanvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        }
      }, 'image/jpeg', 0.92);
    });
  }

  /**
   * Recorte básico cuando no se detecta el documento
   */
  private basicCrop(img: HTMLImageElement): Promise<Blob> {
    const margin = 0.05; // 5% de margen
    const cropX = img.width * margin;
    const cropY = img.height * margin;
    const cropWidth = img.width * (1 - 2 * margin);
    const cropHeight = img.height * (1 - 2 * margin);
    
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = cropWidth;
    outputCanvas.height = cropHeight;
    const outputCtx = outputCanvas.getContext('2d');
    
    if (!outputCtx) throw new Error('No se pudo crear contexto');
    
    outputCtx.drawImage(
      img,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );
    
    return new Promise((resolve) => {
      outputCanvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        }
      }, 'image/jpeg', 0.92);
    });
  }
}
