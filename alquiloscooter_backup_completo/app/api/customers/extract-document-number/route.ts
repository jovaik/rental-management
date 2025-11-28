
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string; // 'id_document' o 'driver_license'

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    // Convertir archivo a base64
    const arrayBuffer = await file.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type || 'image/jpeg';
    const dataUri = `data:${mimeType};base64,${base64String}`;

    // Preparar prompt según el tipo de documento
    let prompt = '';
    if (documentType === 'id_document') {
      prompt = `Analiza esta imagen de un documento de identidad (DNI, NIE o Pasaporte).
Extrae SOLO el número del documento y respóndelo en texto plano sin explicaciones.
Si es DNI español: formato 12345678A
Si es NIE español: formato X1234567A o Y1234567A
Si es Pasaporte: extrae el número tal cual aparece
Responde únicamente el número, nada más.`;
    } else if (documentType === 'driver_license') {
      prompt = `Analiza esta imagen de un carnet de conducir.
Extrae SOLO el número del carnet de conducir y respóndelo en texto plano sin explicaciones.
Busca el campo que dice "Número" o similar.
Responde únicamente el número, nada más.`;
    } else {
      return NextResponse.json({ error: 'Tipo de documento no válido' }, { status: 400 });
    }

    // Llamar a la API de visión artificial
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
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
                  url: dataUri
                }
              }
            ]
          }
        ],
        max_tokens: 100,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      console.error('Error en API de visión:', await response.text());
      return NextResponse.json(
        { error: 'Error al procesar la imagen' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content?.trim() || '';

    console.log('📄 Número extraído:', extractedText);

    return NextResponse.json({
      documentNumber: extractedText,
      documentType: documentType
    });

  } catch (error) {
    console.error('Error extracting document number:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
