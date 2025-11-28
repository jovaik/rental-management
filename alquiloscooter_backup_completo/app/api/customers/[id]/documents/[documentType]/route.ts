
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { downloadFile } from '@/lib/s3';

export const dynamic = 'force-dynamic';

// GET /api/customers/[id]/documents/[documentType] - Obtener URL firmada de un documento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentType: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id, documentType } = await params;
    const customerId = parseInt(id);

    // Validar tipo de documento
    const validTypes = ['driver_license_front', 'driver_license_back', 'id_document_front', 'id_document_back'];
    if (!validTypes.includes(documentType)) {
      return NextResponse.json({ error: 'Tipo de documento inválido' }, { status: 400 });
    }

    // Obtener el cliente
    const customer = await prisma.carRentalCustomers.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        driver_license_front: true,
        driver_license_back: true,
        id_document_front: true,
        id_document_back: true
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Obtener la clave S3 del documento
    const s3Key = (customer as any)[documentType];
    
    if (!s3Key) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    // Generar URL firmada
    const signedUrl = await downloadFile(s3Key);

    return NextResponse.json({ url: signedUrl });

  } catch (error) {
    console.error('Error obteniendo documento:', error);
    return NextResponse.json(
      { error: 'Error al obtener documento' },
      { status: 500 }
    );
  }
}
