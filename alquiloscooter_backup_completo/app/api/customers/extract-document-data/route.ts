
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🔵 [OCR-API] /api/customers/extract-document-data - Inicio de petición');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;

    console.log('📥 [OCR-API] Parámetros recibidos:', {
      hasFile: !!file,
      fileSize: file?.size,
      fileName: file?.name,
      fileType: file?.type,
      documentType
    });

    if (!file) {
      console.error('❌ [OCR-API] No se proporcionó archivo');
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    // Convertir archivo a base64
    console.log('🔄 [OCR-API] Convirtiendo archivo a base64...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    console.log('✅ [OCR-API] Base64 generado:', base64Image.length, 'caracteres');

    // Usar API de Abacus.AI para análisis de imagen con OCR avanzado
    const apiKey = process.env.ABACUSAI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ [OCR-API] No se encontró ABACUSAI_API_KEY');
      return NextResponse.json(
        { error: 'API key no configurada' },
        { status: 500 }
      );
    }
    console.log('🔑 [OCR-API] API key encontrada:', apiKey.substring(0, 8) + '...');

    // Preparar el prompt según el tipo de documento - MULTI-IDIOMA INTERNACIONAL
    let extractionPrompt = '';
    
    if (documentType === 'id_document') {
      extractionPrompt = `Analyze this identity document (ID card, passport, DNI, NIE, or any government-issued ID from ANY country) and extract the following information in strict JSON format:
{
  "documentNumber": "complete document number (alphanumeric, any format)",
  "firstName": "given name(s)/first name(s)",
  "lastName": "surname(s)/family name(s)",
  "dateOfBirth": "date of birth in YYYY-MM-DD format",
  "address": "full address with street and number",
  "city": "city name",
  "postalCode": "postal/zip code",
  "expiryDate": "expiration date in YYYY-MM-DD format if available"
}

CRITICAL INSTRUCTIONS: 
- Return ONLY the JSON object, no additional text
- Works with documents from ANY country (Spain, France, UK, USA, Germany, Italy, etc.)
- If a field is not visible or not present in the document, use null
- Convert all dates to YYYY-MM-DD format regardless of original format
- Extract complete surnames as a single string
- Document number can be any alphanumeric format (12345678A, AB123456, etc.)`;

    } else if (documentType === 'driver_license') {
      extractionPrompt = `Analyze this driver's license (from ANY country) and extract the following information in strict JSON format:
{
  "licenseNumber": "license number (alphanumeric, any format)",
  "firstName": "given name(s)/first name(s)",
  "lastName": "surname(s)/family name(s)",
  "dateOfBirth": "date of birth in YYYY-MM-DD format",
  "address": "full address if visible",
  "city": "city name if visible",
  "postalCode": "postal/zip code if visible",
  "expiryDate": "expiration date in YYYY-MM-DD format"
}

CRITICAL INSTRUCTIONS: 
- Return ONLY the JSON object, no additional text
- Works with driver's licenses from ANY country
- If a field is not visible, use null
- Convert all dates to YYYY-MM-DD format regardless of original format
- Extract complete surnames as a single string`;
    }

    // Llamar a la API de Vision
    console.log('🚀 [OCR-API] Enviando petición a Abacus.AI Vision API...');
    console.log('📊 [OCR-API] Payload:', {
      model: 'gpt-4o',
      promptLength: extractionPrompt.length,
      imageBase64Length: base64Image.length
    });
    
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
                  text: extractionPrompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          temperature: 0.1,
          max_tokens: 1000
        })
      });
      
      console.log('📡 [OCR-API] Respuesta recibida, status:', visionResponse.status);
    } catch (fetchError: any) {
      console.error('❌ [OCR-API] Error de red al llamar a Vision API:', fetchError);
      console.error('❌ [OCR-API] Stack:', fetchError?.stack);
      return NextResponse.json(
        { error: 'Error de conexión con servicio de IA', details: fetchError?.message },
        { status: 500 }
      );
    }

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('❌ [OCR-API] Error en API de Vision:', visionResponse.status, errorText);
      return NextResponse.json(
        { error: 'Error al procesar la imagen', details: errorText.substring(0, 200) },
        { status: 500 }
      );
    }

    const visionResult = await visionResponse.json();
    const extractedText = visionResult.choices?.[0]?.message?.content;

    if (!extractedText) {
      return NextResponse.json(
        { error: 'No se pudo extraer información' },
        { status: 500 }
      );
    }

    // Parsear el JSON extraído
    let extractedData;
    try {
      // Limpiar el texto por si viene con markdown
      const cleanText = extractedText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      extractedData = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Error al parsear JSON:', extractedText);
      return NextResponse.json(
        { error: 'No se pudo interpretar los datos extraídos', rawText: extractedText },
        { status: 500 }
      );
    }

    console.log('Datos extraídos exitosamente:', extractedData);

    return NextResponse.json({
      success: true,
      data: extractedData,
      documentType
    });

  } catch (error) {
    console.error('Error en extract-document-data:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
