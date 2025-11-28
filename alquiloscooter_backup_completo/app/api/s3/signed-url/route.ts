
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getFileUrl } from '@/lib/s3';

// GET: Generar signed URL para acceder a un archivo en S3
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'La clave del archivo (key) es requerida' },
        { status: 400 }
      );
    }

    // Generar signed URL con 1 hora de expiración
    const signedUrl = await getFileUrl(key);

    return NextResponse.json({ url: signedUrl });

  } catch (error: any) {
    console.error('Error generando signed URL:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
