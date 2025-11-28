

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

    const { searchParams } = new URL(request.url);
    const documentType = searchParams.get('documentType');

    if (!documentType || !['driver_license_front', 'driver_license_back', 'id_document_front', 'id_document_back'].includes(documentType)) {
      return NextResponse.json({ error: 'Tipo de documento inválido' }, { status: 400 });
    }

    const customerId = parseInt((await params).id);

    const customer = await prisma.carRentalCustomers.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const cloud_storage_path = (customer as any)[documentType];

    if (!cloud_storage_path) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    // Get signed URL for download
    const signedUrl = await downloadFile(cloud_storage_path);

    return NextResponse.json({ url: signedUrl });

  } catch (error) {
    console.error('Document download error:', error);
    return NextResponse.json(
      { error: 'Error al descargar el documento' },
      { status: 500 }
    );
  }
}

