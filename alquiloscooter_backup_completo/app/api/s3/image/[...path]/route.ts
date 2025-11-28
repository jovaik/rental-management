
import { NextRequest, NextResponse } from 'next/server';
import { getFileUrl } from '@/lib/s3';

/**
 * Endpoint proxy para imágenes de S3
 * Genera signed URLs on-demand con 7 días de validez y redirige
 * GET /api/s3/image/[...path]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Reconstruir la ruta completa del archivo en S3
    const s3Key = params.path.join('/');

    console.log('🖼️ Generando signed URL para:', s3Key);

    // Generar signed URL con 7 días de validez
    const SEVEN_DAYS = 7 * 24 * 60 * 60; // 604800 segundos
    const signedUrl = await getFileUrl(s3Key, SEVEN_DAYS);

    console.log('✅ Signed URL generada para:', s3Key);

    // Redirigir a la signed URL
    return NextResponse.redirect(signedUrl, 302);

  } catch (error) {
    console.error('❌ Error generando signed URL:', error);
    return NextResponse.json(
      { error: 'Error al obtener imagen' },
      { status: 500 }
    );
  }
}
