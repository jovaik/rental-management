
import { NextRequest, NextResponse } from 'next/server';

// Endpoint temporal para debugging del OCR
export async function POST(request: NextRequest) {
  console.log('🔵 [DEBUG-OCR] Inicio de test');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('📥 [DEBUG-OCR] Archivo recibido:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Convertir a base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');
    
    const isPDF = file.type === 'application/pdf';
    const mimeType = isPDF ? 'application/pdf' : 'image/jpeg';
    
    console.log('🔄 [DEBUG-OCR] Preparando petición a IA:', {
      mimeType,
      base64Length: base64Data.length
    });

    // Prompt simplificado para debugging
    const debugPrompt = `Analiza esta imagen de un documento (ticket o factura) y extrae los siguientes campos. Devuelve SOLO JSON válido, sin markdown:

⚠️ **REGLA CRÍTICA ESPAÑOLA:**
- Si dice "FACTURA SIMPLIFICADA" → tipo_documento = "TICKET"
- Si dice solo "FACTURA" (sin "simplificada") Y tiene CIF → tipo_documento = "FACTURA"
- Si dice "TICKET" o "RECIBO" → tipo_documento = "TICKET"

{
  "tipo_documento": "TICKET o FACTURA (según las reglas anteriores)",
  "proveedor": "nombre del comercio/empresa (OBLIGATORIO)",
  "fecha": "YYYY-MM-DD",
  "total": número,
  "numero_factura": "si aplica",
  "descripcion": "breve descripción"
}

IMPORTANTE:
- El proveedor es OBLIGATORIO (el nombre del comercio que emite el documento)
- Si es ticket de gasolinera, el proveedor es el nombre de la gasolinera
- "FACTURA SIMPLIFICADA" = TICKET (no es factura completa)
- Devuelve SOLO el JSON, sin explicaciones`;

    const apiKey = process.env.ABACUSAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    console.log('🚀 [DEBUG-OCR] Enviando a IA...');

    const visionResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
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
                text: debugPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    });

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('❌ [DEBUG-OCR] Error en API:', visionResponse.status, errorText);
      return NextResponse.json({ error: 'AI API error', details: errorText.substring(0, 200) }, { status: 500 });
    }

    const visionData = await visionResponse.json();
    console.log('📊 [DEBUG-OCR] Respuesta de IA:', JSON.stringify(visionData, null, 2));

    if (!visionData.choices || visionData.choices.length === 0) {
      return NextResponse.json({ error: 'No AI response' }, { status: 500 });
    }

    const content = visionData.choices[0].message.content;
    console.log('📝 [DEBUG-OCR] Contenido bruto:', content);

    // Intentar parsear el JSON
    let extractedData;
    try {
      let jsonContent = content.trim();
      
      // Remover markdown si existe
      if (jsonContent.includes('```json')) {
        jsonContent = jsonContent.split('```json')[1].split('```')[0].trim();
      } else if (jsonContent.includes('```')) {
        jsonContent = jsonContent.split('```')[1].split('```')[0].trim();
      }
      
      extractedData = JSON.parse(jsonContent);
      console.log('✅ [DEBUG-OCR] JSON parseado:', extractedData);
    } catch (parseError: any) {
      console.error('❌ [DEBUG-OCR] Error parseando JSON:', parseError);
      return NextResponse.json({ 
        error: 'JSON parse error', 
        rawContent: content,
        parseError: parseError?.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: extractedData,
      rawContent: content,
      debug: {
        fileType: mimeType,
        base64Length: base64Data.length,
        aiModel: 'gpt-4o-mini'
      }
    });

  } catch (error: any) {
    console.error('❌ [DEBUG-OCR] Error general:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      details: error?.message,
      stack: error?.stack 
    }, { status: 500 });
  }
}
