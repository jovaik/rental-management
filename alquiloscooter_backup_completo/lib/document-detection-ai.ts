
/**
 * Detección automática de bordes de documentos usando GPT-4 Vision
 * Similar a CamScanner: detecta las 4 esquinas del documento instantáneamente
 */

interface Corner {
  x: number;
  y: number;
}

interface DetectionResult {
  corners: [Corner, Corner, Corner, Corner]; // TopLeft, TopRight, BottomRight, BottomLeft
  confidence: number;
  success: boolean;
  error?: string;
}

/**
 * Detecta las 4 esquinas de un documento en una imagen usando GPT-4 Vision
 * Llama al endpoint API del servidor para no exponer la API key
 */
export async function detectDocumentCorners(imageFile: File): Promise<DetectionResult> {
  try {
    // Obtener dimensiones de la imagen
    const dimensions = await getImageDimensions(imageFile);
    
    // Preparar FormData para enviar al servidor
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('width', dimensions.width.toString());
    formData.append('height', dimensions.height.toString());

    // Llamar al endpoint API del servidor
    const response = await fetch('/api/document-detection', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      corners: result.corners as [Corner, Corner, Corner, Corner],
      confidence: result.confidence || 0,
      success: result.success || false,
      error: result.error
    };

  } catch (error: any) {
    console.error('❌ Error en detección AI:', error);
    
    // Fallback: esquinas por defecto con margen del 5%
    const dimensions = await getImageDimensions(imageFile);
    return {
      corners: getDefaultCorners(dimensions.width, dimensions.height),
      confidence: 0,
      success: false,
      error: error.message
    };
  }
}

/**
 * Convierte File a base64 data URL
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Obtiene dimensiones de una imagen
 */
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Genera esquinas por defecto con margen del 5%
 */
function getDefaultCorners(width: number, height: number): [Corner, Corner, Corner, Corner] {
  const margin = 0.05; // 5% de margen
  return [
    { x: Math.round(width * margin), y: Math.round(height * margin) },           // TopLeft
    { x: Math.round(width * (1 - margin)), y: Math.round(height * margin) },     // TopRight
    { x: Math.round(width * (1 - margin)), y: Math.round(height * (1 - margin)) }, // BottomRight
    { x: Math.round(width * margin), y: Math.round(height * (1 - margin)) }      // BottomLeft
  ];
}
