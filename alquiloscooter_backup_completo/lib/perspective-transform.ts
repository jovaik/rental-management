
/**
 * Transformación de perspectiva para enderezar documentos
 * Convierte un cuadrilátero arbitrario en un rectángulo perfecto
 */

interface Point {
  x: number;
  y: number;
}

interface TransformResult {
  canvas: HTMLCanvasElement;
  blob: Blob;
}

/**
 * Aplica transformación de perspectiva a una imagen usando 4 puntos
 * @param imageFile Archivo de imagen original
 * @param corners 4 esquinas en orden: TopLeft, TopRight, BottomRight, BottomLeft
 * @returns Canvas y Blob con la imagen transformada
 */
export async function applyPerspectiveTransform(
  imageFile: File,
  corners: [Point, Point, Point, Point]
): Promise<TransformResult> {
  
  // Cargar imagen
  const img = await loadImage(imageFile);
  
  // Calcular dimensiones del documento enderezado
  const outputSize = calculateOutputSize(corners);
  
  // Crear canvas de salida
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = outputSize.width;
  outputCanvas.height = outputSize.height;
  const ctx = outputCanvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('No se pudo crear contexto del canvas');
  }

  // Aplicar transformación de perspectiva
  const matrix = computePerspectiveMatrix(
    corners,
    [
      { x: 0, y: 0 },                           // TopLeft de salida
      { x: outputSize.width, y: 0 },           // TopRight de salida
      { x: outputSize.width, y: outputSize.height }, // BottomRight de salida
      { x: 0, y: outputSize.height }           // BottomLeft de salida
    ]
  );

  // Aplicar transformación píxel por píxel (método robusto)
  const srcData = await getImageData(img);
  const dstData = ctx.createImageData(outputSize.width, outputSize.height);
  
  for (let y = 0; y < outputSize.height; y++) {
    for (let x = 0; x < outputSize.width; x++) {
      // Transformar coordenadas de destino a fuente
      const srcPoint = transformPoint({ x, y }, matrix);
      
      // Interpolación bilineal para suavizar
      const color = bilinearInterpolate(srcData, img.width, img.height, srcPoint.x, srcPoint.y);
      
      const dstIdx = (y * outputSize.width + x) * 4;
      dstData.data[dstIdx] = color.r;
      dstData.data[dstIdx + 1] = color.g;
      dstData.data[dstIdx + 2] = color.b;
      dstData.data[dstIdx + 3] = color.a;
    }
  }
  
  ctx.putImageData(dstData, 0, 0);
  
  // Convertir a blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    outputCanvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Error al convertir canvas a blob'));
    }, 'image/jpeg', 0.92);
  });
  
  return {
    canvas: outputCanvas,
    blob
  };
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

/**
 * Calcula las dimensiones óptimas del documento enderezado
 */
function calculateOutputSize(corners: [Point, Point, Point, Point]): { width: number; height: number } {
  const [tl, tr, br, bl] = corners;
  
  // Calcular anchos (superior e inferior)
  const topWidth = Math.sqrt(Math.pow(tr.x - tl.x, 2) + Math.pow(tr.y - tl.y, 2));
  const bottomWidth = Math.sqrt(Math.pow(br.x - bl.x, 2) + Math.pow(br.y - bl.y, 2));
  const width = Math.max(topWidth, bottomWidth);
  
  // Calcular alturas (izquierda y derecha)
  const leftHeight = Math.sqrt(Math.pow(bl.x - tl.x, 2) + Math.pow(bl.y - tl.y, 2));
  const rightHeight = Math.sqrt(Math.pow(br.x - tr.x, 2) + Math.pow(br.y - tr.y, 2));
  const height = Math.max(leftHeight, rightHeight);
  
  return {
    width: Math.round(width),
    height: Math.round(height)
  };
}

/**
 * Calcula la matriz de transformación de perspectiva inversa
 * Basado en: http://math.stackexchange.com/questions/296794
 */
function computePerspectiveMatrix(
  src: [Point, Point, Point, Point],
  dst: [Point, Point, Point, Point]
): number[][] {
  
  // Matriz de transformación homográfica de 8 parámetros
  const A: number[][] = [];
  const b: number[] = [];
  
  for (let i = 0; i < 4; i++) {
    A.push([
      dst[i].x, dst[i].y, 1, 0, 0, 0, -dst[i].x * src[i].x, -dst[i].y * src[i].x
    ]);
    b.push(src[i].x);
    
    A.push([
      0, 0, 0, dst[i].x, dst[i].y, 1, -dst[i].x * src[i].y, -dst[i].y * src[i].y
    ]);
    b.push(src[i].y);
  }
  
  // Resolver sistema lineal Ax = b usando eliminación gaussiana
  const h = gaussianElimination(A, b);
  
  // Construir matriz 3x3
  return [
    [h[0], h[1], h[2]],
    [h[3], h[4], h[5]],
    [h[6], h[7], 1]
  ];
}

/**
 * Transformar un punto usando la matriz de perspectiva
 */
function transformPoint(p: Point, matrix: number[][]): Point {
  const x = matrix[0][0] * p.x + matrix[0][1] * p.y + matrix[0][2];
  const y = matrix[1][0] * p.x + matrix[1][1] * p.y + matrix[1][2];
  const z = matrix[2][0] * p.x + matrix[2][1] * p.y + matrix[2][2];
  
  return {
    x: x / z,
    y: y / z
  };
}

/**
 * Resolución de sistema lineal por eliminación gaussiana
 */
function gaussianElimination(A: number[][], b: number[]): number[] {
  const n = b.length;
  
  // Forward elimination
  for (let i = 0; i < n; i++) {
    // Buscar pivote
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) {
        maxRow = k;
      }
    }
    
    // Intercambiar filas
    [A[i], A[maxRow]] = [A[maxRow], A[i]];
    [b[i], b[maxRow]] = [b[maxRow], b[i]];
    
    // Eliminar columna
    for (let k = i + 1; k < n; k++) {
      const factor = A[k][i] / A[i][i];
      for (let j = i; j < A[0].length; j++) {
        A[k][j] -= factor * A[i][j];
      }
      b[k] -= factor * b[i];
    }
  }
  
  // Back substitution
  const x: number[] = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = b[i];
    for (let j = i + 1; j < n; j++) {
      x[i] -= A[i][j] * x[j];
    }
    x[i] /= A[i][i];
  }
  
  return x;
}

/**
 * Obtiene ImageData de una imagen
 */
async function getImageData(img: HTMLImageElement): Promise<ImageData> {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('No se pudo crear contexto del canvas');
  }
  
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, img.width, img.height);
}

/**
 * Interpolación bilineal para suavizar la transformación
 */
function bilinearInterpolate(
  imageData: ImageData,
  width: number,
  height: number,
  x: number,
  y: number
): { r: number; g: number; b: number; a: number } {
  
  // Clamp a los límites de la imagen
  x = Math.max(0, Math.min(width - 1, x));
  y = Math.max(0, Math.min(height - 1, y));
  
  const x1 = Math.floor(x);
  const x2 = Math.min(x1 + 1, width - 1);
  const y1 = Math.floor(y);
  const y2 = Math.min(y1 + 1, height - 1);
  
  const fx = x - x1;
  const fy = y - y1;
  
  const getPixel = (px: number, py: number) => {
    const idx = (py * width + px) * 4;
    return {
      r: imageData.data[idx],
      g: imageData.data[idx + 1],
      b: imageData.data[idx + 2],
      a: imageData.data[idx + 3]
    };
  };
  
  const p1 = getPixel(x1, y1);
  const p2 = getPixel(x2, y1);
  const p3 = getPixel(x1, y2);
  const p4 = getPixel(x2, y2);
  
  return {
    r: Math.round(
      p1.r * (1 - fx) * (1 - fy) +
      p2.r * fx * (1 - fy) +
      p3.r * (1 - fx) * fy +
      p4.r * fx * fy
    ),
    g: Math.round(
      p1.g * (1 - fx) * (1 - fy) +
      p2.g * fx * (1 - fy) +
      p3.g * (1 - fx) * fy +
      p4.g * fx * fy
    ),
    b: Math.round(
      p1.b * (1 - fx) * (1 - fy) +
      p2.b * fx * (1 - fy) +
      p3.b * (1 - fx) * fy +
      p4.b * fx * fy
    ),
    a: Math.round(
      p1.a * (1 - fx) * (1 - fy) +
      p2.a * fx * (1 - fy) +
      p3.a * (1 - fx) * fy +
      p4.a * fx * fy
    )
  };
}
