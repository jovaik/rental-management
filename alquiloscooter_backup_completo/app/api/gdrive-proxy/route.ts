
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { downloadFileAsBuffer } from '@/lib/s3';

export const dynamic = 'force-dynamic';

/**
 * Endpoint proxy para servir archivos de Google Drive/S3
 * GET /api/gdrive-proxy?path=5155/expedientes/...
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ error: 'Falta parámetro path' }, { status: 400 });
    }

    // Descargar el archivo desde S3 (que es donde están almacenados realmente)
    const buffer = await downloadFileAsBuffer(path);

    // Determinar el tipo MIME basado en la extensión
    const extension = path.split('.').pop()?.toLowerCase();
    let contentType = 'image/jpeg'; // default
    if (extension === 'png') {
      contentType = 'image/png';
    } else if (extension === 'jpg' || extension === 'jpeg') {
      contentType = 'image/jpeg';
    } else if (extension === 'gif') {
      contentType = 'image/gif';
    } else if (extension === 'pdf') {
      contentType = 'application/pdf';
    }

    // Devolver el archivo con el content-type correcto
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error sirviendo archivo:', error);
    return NextResponse.json(
      { error: 'Error sirviendo archivo' },
      { status: 500 }
    );
  }
}
