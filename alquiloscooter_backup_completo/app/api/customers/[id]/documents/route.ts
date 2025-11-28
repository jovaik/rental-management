
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadFile } from '@/lib/s3';

export const dynamic = 'force-dynamic';

// POST /api/customers/[id]/documents - Subir múltiples documentos
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const customerId = parseInt((await params).id);

    // Verificar que el cliente existe
    const customer = await prisma.carRentalCustomers.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const formData = await request.formData();

    // Función para subir un documento (igual que inspecciones)
    const uploadDocument = async (file: File | null, docType: string) => {
      if (!file) return null;
      
      const buffer = Buffer.from(await file.arrayBuffer());
      const timestamp = Date.now();
      const fileName = `customers/${customerId}/${docType}_${timestamp}_${file.name}`;
      
      return await uploadFile(buffer, fileName);
    };

    // Subir todos los documentos que se hayan enviado
    const updateData: any = {};
    const docTypes = ['driver_license_front', 'driver_license_back', 'id_document_front', 'id_document_back'];
    
    for (const docType of docTypes) {
      const file = formData.get(docType) as File | null;
      if (file) {
        const s3Key = await uploadDocument(file, docType);
        if (s3Key) {
          updateData[docType] = s3Key;
        }
      }
    }

    // Si no se subió ningún documento, retornar error
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún documento' },
        { status: 400 }
      );
    }

    // Actualizar el cliente con los nuevos documentos
    const updatedCustomer = await prisma.carRentalCustomers.update({
      where: { id: customerId },
      data: updateData
    });

    return NextResponse.json({
      message: 'Documentos subidos exitosamente',
      customer: updatedCustomer
    });

  } catch (error) {
    console.error('Error subiendo documentos:', error);
    return NextResponse.json(
      { error: 'Error al subir documentos' },
      { status: 500 }
    );
  }
}
