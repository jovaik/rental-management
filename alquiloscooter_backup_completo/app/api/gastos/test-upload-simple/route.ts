
import { NextRequest, NextResponse } from 'next/server';

// ✅ Endpoint de prueba ULTRA SIMPLE - Solo recibe archivo y devuelve info
export async function POST(request: NextRequest) {
  console.log('🧪 [TEST-UPLOAD] Iniciando test de subida básico...');
  
  try {
    // Verificar Content-Type
    const contentType = request.headers.get('content-type');
    console.log('📋 [TEST-UPLOAD] Content-Type:', contentType);

    if (!contentType?.includes('multipart/form-data')) {
      return NextResponse.json({
        success: false,
        error: 'Content-Type debe ser multipart/form-data',
        received: contentType
      }, { status: 400 });
    }

    // Intentar leer FormData
    console.log('📦 [TEST-UPLOAD] Intentando leer FormData...');
    const formData = await request.formData();
    console.log('✅ [TEST-UPLOAD] FormData leído correctamente');

    // Verificar si hay archivo
    const file = formData.get('file') as File | null;
    
    if (!file) {
      console.error('❌ [TEST-UPLOAD] No se encontró archivo en FormData');
      return NextResponse.json({
        success: false,
        error: 'No se encontró archivo en FormData',
        formDataKeys: Array.from(formData.keys())
      }, { status: 400 });
    }

    console.log('📄 [TEST-UPLOAD] Archivo recibido:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Intentar leer el contenido del archivo
    console.log('📖 [TEST-UPLOAD] Intentando leer contenido...');
    const bytes = await file.arrayBuffer();
    console.log('✅ [TEST-UPLOAD] Archivo leído:', bytes.byteLength, 'bytes');

    // ✅ Respuesta exitosa
    return NextResponse.json({
      success: true,
      message: '✅ Archivo recibido correctamente',
      fileInfo: {
        name: file.name,
        size: file.size,
        sizeKB: Math.round(file.size / 1024),
        type: file.type,
        bytesRead: bytes.byteLength
      }
    });

  } catch (error: any) {
    console.error('❌ [TEST-UPLOAD] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error desconocido',
      stack: error.stack
    }, { status: 500 });
  }
}
