
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { deleteFile } from '@/lib/s3';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customerId = parseInt((await params).id);

    // Check if customer exists
    const customer = await prisma.carRentalCustomers.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const { documentType } = await request.json();

    if (!documentType || !['driver_license_front', 'driver_license_back', 'id_document_front', 'id_document_back'].includes(documentType)) {
      return NextResponse.json({ error: 'Tipo de documento inválido' }, { status: 400 });
    }

    // Get current document path
    const currentPath = (customer as any)[documentType];

    // Delete from S3 if exists
    if (currentPath) {
      try {
        await deleteFile(currentPath);
      } catch (error) {
        console.error('Error deleting file from S3:', error);
        // Continue even if S3 deletion fails
      }
    }

    // Update customer record to remove the document reference
    const updateData: any = {};
    updateData[documentType] = null;

    const updatedCustomer = await prisma.carRentalCustomers.update({
      where: { id: customerId },
      data: updateData
    });

    return NextResponse.json({
      message: 'Documento eliminado exitosamente',
      customer: updatedCustomer
    });

  } catch (error) {
    console.error('Document deletion error:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el documento' },
      { status: 500 }
    );
  }
}
