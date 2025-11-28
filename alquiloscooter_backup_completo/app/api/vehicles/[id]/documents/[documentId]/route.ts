

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { deleteFile } from '@/lib/s3';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, documentId } = await params;
    const vehicleId = parseInt(id);
    const docId = parseInt(documentId);

    // Check if document exists
    const document = await prisma.carRentalVehicleDocuments.findUnique({
      where: { id: docId }
    });

    if (!document) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    if (document.car_id !== vehicleId) {
      return NextResponse.json({ error: 'Documento no pertenece a este vehículo' }, { status: 400 });
    }

    // Delete from S3
    try {
      await deleteFile(document.file_path);
    } catch (s3Error) {
      console.error('S3 deletion error:', s3Error);
      // Continue even if S3 deletion fails
    }

    // Delete from database
    await prisma.carRentalVehicleDocuments.delete({
      where: { id: docId }
    });

    return NextResponse.json({
      message: 'Documento eliminado exitosamente'
    });

  } catch (error) {
    console.error('Document deletion error:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el documento' },
      { status: 500 }
    );
  }
}
