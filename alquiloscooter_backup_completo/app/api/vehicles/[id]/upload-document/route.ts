

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

    const vehicleId = parseInt((await params).id);

    // Check if vehicle exists
    const vehicle = await prisma.carRentalCars.findUnique({
      where: { id: vehicleId }
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    if (!documentType) {
      return NextResponse.json({ error: 'Tipo de documento requerido' }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: 'Título de documento requerido' }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate S3 key
    const timestamp = Date.now();
    const fileName = `vehicles/${vehicleId}/${documentType}_${timestamp}_${file.name}`;
    
    // Upload to S3
    const cloud_storage_path = await uploadFile(buffer, fileName);

    // Create document record
    const document = await prisma.carRentalVehicleDocuments.create({
      data: {
        car_id: vehicleId,
        document_type: documentType,
        title: title,
        description: description,
        file_path: cloud_storage_path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: parseInt((session.user as any).id),
      }
    });

    return NextResponse.json({
      message: 'Documento subido exitosamente',
      document
    });

  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Error al subir el documento' },
      { status: 500 }
    );
  }
}
