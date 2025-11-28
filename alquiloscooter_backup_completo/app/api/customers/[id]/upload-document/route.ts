

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadFile } from '@/lib/s3';

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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    if (!documentType || !['driver_license_front', 'driver_license_back', 'id_document_front', 'id_document_back'].includes(documentType)) {
      return NextResponse.json({ error: 'Tipo de documento inválido' }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate S3 key
    const timestamp = Date.now();
    const fileName = `customers/${customerId}/${documentType}_${timestamp}_${file.name}`;
    
    // Upload to S3
    const cloud_storage_path = await uploadFile(buffer, fileName);

    // Update customer record
    const updateData: any = {};
    updateData[documentType] = cloud_storage_path;

    const updatedCustomer = await prisma.carRentalCustomers.update({
      where: { id: customerId },
      data: updateData
    });

    return NextResponse.json({
      message: 'Documento subido exitosamente',
      cloud_storage_path,
      customer: updatedCustomer
    });

  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Error al subir el documento' },
      { status: 500 }
    );
  }
}

