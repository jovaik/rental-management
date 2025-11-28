
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadFile } from '@/lib/s3';
import { regenerateContractIfNotSigned } from '@/lib/contract-regeneration';

// POST: Subir documentos de un conductor adicional
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; driverId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const bookingId = parseInt(resolvedParams.id);
    const driverId = parseInt(resolvedParams.driverId);

    console.log(`📤 [Driver Documents] Subiendo documento para conductor ${driverId} en reserva ${bookingId}`);

    // Verificar que el conductor existe y pertenece a esta reserva
    const driver = await prisma.bookingDrivers.findFirst({
      where: {
        id: driverId,
        booking_id: bookingId
      }
    });

    if (!driver) {
      console.error(`❌ [Driver Documents] Conductor ${driverId} no encontrado en reserva ${bookingId}`);
      return NextResponse.json(
        { error: 'Conductor no encontrado en esta reserva' },
        { status: 404 }
      );
    }

    // Procesar el FormData
    const formData = await request.formData();
    const documentType = formData.get('documentType') as string;
    const file = formData.get('file') as File;

    console.log(`📄 [Driver Documents] Tipo de documento: ${documentType}, Archivo: ${file?.name}, Tamaño: ${file?.size} bytes`);

    if (!documentType || !file) {
      console.error(`❌ [Driver Documents] Faltan datos: documentType=${documentType}, file=${!!file}`);
      return NextResponse.json(
        { error: 'Tipo de documento y archivo son requeridos' },
        { status: 400 }
      );
    }

    // Validar tipo de documento
    const validTypes = ['id_document_front', 'id_document_back', 'driver_license_front', 'driver_license_back'];
    if (!validTypes.includes(documentType)) {
      console.error(`❌ [Driver Documents] Tipo de documento inválido: ${documentType}`);
      return NextResponse.json(
        { error: 'Tipo de documento inválido' },
        { status: 400 }
      );
    }

    // Subir archivo a S3
    console.log(`☁️ [Driver Documents] Subiendo a S3...`);
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `driver_${driverId}_${documentType}_${Date.now()}.${fileExtension}`;
    const s3Key = `booking_${bookingId}/drivers/driver_${driverId}/${fileName}`;
    
    const s3Url = await uploadFile(buffer, s3Key);
    console.log(`✅ [Driver Documents] Archivo subido a S3: ${s3Key}`);

    // Actualizar el registro del conductor
    const updateData: any = {};
    updateData[documentType] = s3Url;

    const updatedDriver = await prisma.bookingDrivers.update({
      where: { id: driverId },
      data: updateData
    });

    console.log(`✅ [Driver Documents] Conductor actualizado en BD. Campo ${documentType} guardado.`);

    // Regenerar contrato si no está firmado
    try {
      await regenerateContractIfNotSigned(
        bookingId,
        `Actualizado documento ${documentType} del conductor ${driver.full_name}`,
        (session.user as any)?.email || 'system'
      );
      console.log(`✅ [Driver Documents] Contrato regenerado exitosamente`);
    } catch (contractError) {
      console.error('⚠️ [Driver Documents] Error regenerando contrato:', contractError);
    }

    return NextResponse.json({
      message: 'Documento subido exitosamente',
      documentType,
      url: s3Url,
      driver: updatedDriver
    });

  } catch (error: any) {
    console.error('Error subiendo documento del conductor:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar un documento de un conductor adicional
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; driverId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const bookingId = parseInt(resolvedParams.id);
    const driverId = parseInt(resolvedParams.driverId);

    // Obtener tipo de documento de la query string
    const url = new URL(request.url);
    const documentType = url.searchParams.get('documentType');

    if (!documentType) {
      return NextResponse.json(
        { error: 'Tipo de documento es requerido' },
        { status: 400 }
      );
    }

    // Validar tipo de documento
    const validTypes = ['id_document_front', 'id_document_back', 'driver_license_front', 'driver_license_back'];
    if (!validTypes.includes(documentType)) {
      return NextResponse.json(
        { error: 'Tipo de documento inválido' },
        { status: 400 }
      );
    }

    // Verificar que el conductor existe y pertenece a esta reserva
    const driver = await prisma.bookingDrivers.findFirst({
      where: {
        id: driverId,
        booking_id: bookingId
      }
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Conductor no encontrado en esta reserva' },
        { status: 404 }
      );
    }

    // Eliminar el documento (establecer a null)
    const updateData: any = {};
    updateData[documentType] = null;

    const updatedDriver = await prisma.bookingDrivers.update({
      where: { id: driverId },
      data: updateData
    });

    // Regenerar contrato si no está firmado
    try {
      await regenerateContractIfNotSigned(
        bookingId,
        `Eliminado documento ${documentType} del conductor ${driver.full_name}`,
        (session.user as any)?.email || 'system'
      );
    } catch (contractError) {
      console.error('Error regenerando contrato:', contractError);
    }

    return NextResponse.json({
      message: 'Documento eliminado exitosamente',
      driver: updatedDriver
    });

  } catch (error: any) {
    console.error('Error eliminando documento del conductor:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
