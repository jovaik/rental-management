
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🔵 [INVOICE-OCR] /api/gastos/extract-invoice-data - Inicio de petición');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    console.log('📥 [INVOICE-OCR] Parámetros recibidos:', {
      hasFile: !!file,
      fileSize: file?.size,
      fileName: file?.name,
      fileType: file?.type
    });

    if (!file) {
      console.error('❌ [INVOICE-OCR] No se proporcionó archivo');
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    // Convertir archivo a base64
    console.log('🔄 [INVOICE-OCR] Convirtiendo archivo a base64...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');
    console.log('✅ [INVOICE-OCR] Base64 generado:', base64Data.length, 'caracteres');

    // Determinar el tipo MIME correcto
    const mimeType = file.type || 'application/octet-stream';
    console.log('📄 [INVOICE-OCR] Tipo de archivo:', mimeType);

    // Usar API de Abacus.AI para análisis de facturas
    const apiKey = process.env.ABACUSAI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ [INVOICE-OCR] No se encontró ABACUSAI_API_KEY');
      return NextResponse.json(
        { error: 'API key no configurada' },
        { status: 500 }
      );
    }
    console.log('🔑 [INVOICE-OCR] API key encontrada');

    // ✅ PROMPT OPTIMIZADO CON ÉNFASIS EN CIF/NIF
    const extractionPrompt = `Analiza esta factura o ticket español y extrae los siguientes datos en formato JSON:

{
  "tipo_documento": "FACTURA o TICKET (si dice 'FACTURA SIMPLIFICADA' = TICKET)",
  "fecha": "fecha en formato YYYY-MM-DD",
  "numero_factura": "número de factura si existe",
  "proveedor": "nombre del proveedor/empresa",
  "proveedor_cif": "CIF/NIF del proveedor (BUSCAR CON MÁXIMA PRIORIDAD)",
  "descripcion": "descripción breve del gasto",
  "base_imponible": número sin IVA si existe,
  "iva_porcentaje": porcentaje de IVA si existe,
  "iva_importe": importe de IVA si existe,
  "total": total final del documento,
  "categoria": "categoría del gasto (ej: Combustible, Mantenimiento, etc)",
  "metodo_pago": "método de pago si se menciona (Efectivo, Tarjeta, etc)"
}

INSTRUCCIONES CRÍTICAS:
- Devuelve SOLO el JSON, sin texto adicional
- Si un campo no existe, usa null
- Convierte todas las fechas a formato YYYY-MM-DD
- El total es OBLIGATORIO
- El CIF/NIF es CRÍTICO: búscalo en todo el documento (puede aparecer como "CIF:", "NIF:", "N.I.F:", o simplemente un código alfanumérico de 9 caracteres cerca del nombre del proveedor)
- Formatos comunes de CIF/NIF: B12345678, 12345678A, A12345678`;

    // Llamar a la API de Vision
    console.log('🚀 [INVOICE-OCR] Enviando petición a Abacus.AI Vision API...');
    
    let visionResponse;
    try {
      const apiUrl = 'https://apps.abacus.ai/v1/chat/completions';
      
      console.log('📡 [INVOICE-OCR] URL de la API:', apiUrl);
      
      visionResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: extractionPrompt
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
          max_tokens: 1000,
          temperature: 0.1
        })
      });

      console.log('📡 [INVOICE-OCR] Respuesta de Vision API - Status:', visionResponse.status);
      
      if (!visionResponse.ok) {
        const errorText = await visionResponse.text();
        console.error('❌ [INVOICE-OCR] Error de Vision API:', errorText);
        throw new Error(`Error de Vision API: ${visionResponse.status} - ${errorText}`);
      }

    } catch (error: any) {
      console.error('❌ [INVOICE-OCR] Error al llamar Vision API:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Error al procesar el documento con IA',
          details: error.message 
        },
        { status: 500 }
      );
    }

    // Procesar respuesta
    let aiResponse;
    try {
      aiResponse = await visionResponse.json();
      console.log('📦 [INVOICE-OCR] Respuesta completa de la API:', JSON.stringify(aiResponse, null, 2));
    } catch (error) {
      console.error('❌ [INVOICE-OCR] Error al parsear respuesta JSON:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Error al procesar respuesta de IA' 
        },
        { status: 500 }
      );
    }

    // Extraer contenido de la respuesta
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('❌ [INVOICE-OCR] No se recibió contenido de la IA');
      return NextResponse.json(
        { 
          success: false,
          error: 'No se pudo extraer datos del documento' 
        },
        { status: 500 }
      );
    }

    console.log('📄 [INVOICE-OCR] Contenido extraído:', content);

    // Parsear JSON de la respuesta
    let extractedData;
    try {
      // Limpiar markdown si existe
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(cleanedContent);
      console.log('✅ [INVOICE-OCR] Datos parseados exitosamente:', extractedData);
    } catch (error) {
      console.error('❌ [INVOICE-OCR] Error al parsear JSON:', error);
      console.error('❌ [INVOICE-OCR] Contenido que falló:', content);
      return NextResponse.json(
        { 
          success: false,
          error: 'Error al parsear datos extraídos',
          rawContent: content
        },
        { status: 500 }
      );
    }

    // Normalizar datos
    const normalizedData = {
      tipo_documento: extractedData.tipo_documento || 'TICKET',
      fecha: extractedData.fecha || null,
      numero_factura: extractedData.numero_factura || '',
      proveedor: extractedData.proveedor || '',
      proveedor_cif: extractedData.proveedor_cif || '',
      descripcion: extractedData.descripcion || '',
      base_imponible: extractedData.base_imponible ? Number(extractedData.base_imponible) : null,
      iva_porcentaje: extractedData.iva_porcentaje ? Number(extractedData.iva_porcentaje) : null,
      iva_importe: extractedData.iva_importe ? Number(extractedData.iva_importe) : null,
      total: extractedData.total ? Number(extractedData.total) : 0,
      categoria: extractedData.categoria || 'Otros',
      metodo_pago: extractedData.metodo_pago || 'Efectivo'
    };

    // ✅ LOGGING ESPECÍFICO DEL CIF
    if (normalizedData.proveedor_cif) {
      console.log('✅ [INVOICE-OCR] ✓ CIF/NIF DETECTADO:', normalizedData.proveedor_cif);
    } else {
      console.log('⚠️ [INVOICE-OCR] ⚠ CIF/NIF NO DETECTADO - Revisar documento manualmente');
    }

    console.log('✅ [INVOICE-OCR] Datos normalizados:', normalizedData);

    return NextResponse.json({
      success: true,
      data: normalizedData
    });

  } catch (error: any) {
    console.error('❌ [INVOICE-OCR] Error general:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al procesar el documento',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
