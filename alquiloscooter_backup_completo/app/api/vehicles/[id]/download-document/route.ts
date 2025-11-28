

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { downloadFile } from '@/lib/s3';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vehicleId = parseInt((await params).id);
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'ID de documento requerido' }, { status: 400 });
    }

    // Get document
    const document = await prisma.carRentalVehicleDocuments.findUnique({
      where: { id: parseInt(documentId) }
    });

    if (!document) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    if (document.car_id !== vehicleId) {
      return NextResponse.json({ error: 'Documento no pertenece a este vehículo' }, { status: 400 });
    }

    // Generate signed URL
    const signedUrl = await downloadFile(document.file_path);

    return NextResponse.json({
      url: signedUrl,
      fileName: document.file_name
    });

  } catch (error) {
    console.error('Document download error:', error);
    return NextResponse.json(
      { error: 'Error al descargar el documento' },
      { status: 500 }
    );
  }
}
