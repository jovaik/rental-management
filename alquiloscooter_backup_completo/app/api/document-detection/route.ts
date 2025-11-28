
import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint para detección automática de bordes de documentos usando GPT-4 Vision
 * Similar a CamScanner: detecta las 4 esquinas del documento automáticamente
 */
export async function POST(request: NextRequest) {
  console.log('🔵 [API] /api/document-detection - Inicio de petición');
  
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const width = parseInt(formData.get('width') as string);
    const height = parseInt(formData.get('height') as string);

    console.log('📥 [API] Parámetros recibidos:', {
      hasImage: !!image,
      imageSize: image?.size,
      width,
      height
    });

    if (!image || !width || !height) {
      console.error('❌ [API] Faltan parámetros requeridos');
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    // Convertir imagen a base64
    console.log('🔄 [API] Convirtiendo imagen a base64...');
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    const mimeType = image.type || 'image/jpeg';
    console.log('✅ [API] Base64 generado:', base64Image.length, 'caracteres');

    // Obtener API key
    const apiKey = process.env.ABACUSAI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ [API] No se encontró ABACUSAI_API_KEY');
      return NextResponse.json(
        { error: 'API key no configurada' },
        { status: 500 }
      );
    }
    console.log('🔑 [API] API key encontrada:', apiKey.substring(0, 8) + '...');

    // Prompt para detección de bordes
    const prompt = `You are a document scanner AI. Analyze this image and detect the 4 corners of the main document/ID card/driver's license.

CRITICAL INSTRUCTIONS:
- Return ONLY a JSON object with the exact structure shown below
- Coordinates should be in pixels relative to the image dimensions (width: ${width}, height: ${height})
- The corners must be in this EXACT order: TopLeft, TopRight, BottomRight, BottomLeft
- If the document is clearly visible, set confidence to 0.8-1.0
- If the document edges are unclear, set confidence to 0.4-0.7
- If no document is visible, set confidence to 0.0-0.3

Expected JSON format:
{
  "corners": [
    {"x": <number>, "y": <number>},  // TopLeft corner
    {"x": <number>, "y": <number>},  // TopRight corner
    {"x": <number>, "y": <number>},  // BottomRight corner
    {"x": <number>, "y": <number>}   // BottomLeft corner
  ],
  "confidence": <number between 0 and 1>,
  "success": <true if document detected>
}

Return ONLY the JSON, no additional text or markdown formatting.`;

    console.log('📸 [DETECCIÓN] Iniciando detección de bordes con GPT-4 Vision...');
    console.log('📐 [DETECCIÓN] Dimensiones imagen:', { width, height });
    console.log('🔑 [DETECCIÓN] API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NO ENCONTRADA');
    console.log('📦 [DETECCIÓN] Tamaño imagen base64:', base64Image.length, 'caracteres');

    // Llamar a GPT-4 Vision
    console.log('🚀 [DETECCIÓN] Enviando petición a Abacus.AI Vision API...');
    
    let visionResponse;
    try {
      visionResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          temperature: 0.1,
          max_tokens: 500
        })
      });

      console.log('📡 [DETECCIÓN] Respuesta recibida, status:', visionResponse.status);
    } catch (fetchError: any) {
      console.error('❌ [DETECCIÓN] Error al hacer fetch a Vision API:', fetchError);
      console.error('❌ [DETECCIÓN] Stack:', fetchError?.stack);
      return NextResponse.json(
        { 
          success: false,
          error: 'Error de red al conectar con IA',
          confidence: 0,
          details: fetchError?.message || 'Unknown fetch error'
        },
        { status: 500 }
      );
    }

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('❌ [DETECCIÓN] Error en API de Vision:', visionResponse.status, errorText);
      return NextResponse.json(
        { 
          success: false,
          error: `Error API Vision (${visionResponse.status})`,
          confidence: 0,
          details: errorText.substring(0, 200)
        },
        { status: 500 }
      );
    }

    const visionResult = await visionResponse.json();
    const aiResponse = visionResult.choices?.[0]?.message?.content;

    if (!aiResponse) {
      console.error('❌ Respuesta vacía de Vision API');
      return NextResponse.json(
        { 
          success: false,
          error: 'No se pudo detectar el documento',
          confidence: 0
        },
        { status: 500 }
      );
    }

    console.log('🤖 Respuesta IA:', aiResponse);

    // Parsear JSON de la respuesta
    let detectionData;
    try {
      // Limpiar markdown si existe
      const cleanResponse = aiResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      detectionData = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('❌ Error al parsear respuesta IA:', aiResponse);
      return NextResponse.json(
        { 
          success: false,
          error: 'No se pudo interpretar la respuesta de IA',
          confidence: 0,
          rawResponse: aiResponse
        },
        { status: 500 }
      );
    }

    // Validar estructura de datos
    if (!detectionData.corners || detectionData.corners.length !== 4) {
      console.error('❌ Estructura de corners inválida:', detectionData);
      return NextResponse.json(
        { 
          success: false,
          error: 'Detección incompleta',
          confidence: 0
        },
        { status: 500 }
      );
    }

    console.log('✅ Detección exitosa:', {
      confidence: detectionData.confidence,
      corners: detectionData.corners
    });

    return NextResponse.json({
      success: detectionData.success !== false, // Default true si no viene
      confidence: detectionData.confidence || 0,
      corners: detectionData.corners
    });

  } catch (error) {
    console.error('❌ Error en endpoint document-detection:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        confidence: 0,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
