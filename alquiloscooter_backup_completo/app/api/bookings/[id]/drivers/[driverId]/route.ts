
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { regenerateContractIfNotSigned } from '@/lib/contract-regeneration';

const prisma = new PrismaClient();

// GET: Obtener un conductor específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; driverId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const driverId = parseInt(params.driverId);

    const driver = await prisma.bookingDrivers.findUnique({
      where: {
        id: driverId
      }
    });

    if (!driver) {
      return NextResponse.json({ error: 'Conductor no encontrado' }, { status: 404 });
    }

    return NextResponse.json(driver);
  } catch (error) {
    console.error('Error fetching driver:', error);
    return NextResponse.json(
      { error: 'Error al obtener conductor' },
      { status: 500 }
    );
  }
}

// PUT: Actualizar conductor
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; driverId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const driverId = parseInt(params.driverId);
    const body = await request.json();

    const driver = await prisma.bookingDrivers.update({
      where: {
        id: driverId
      },
      data: {
        full_name: body.full_name,
        dni_nie: body.dni_nie,
        driver_license: body.driver_license,
        license_expiry: body.license_expiry ? new Date(body.license_expiry) : null,
        phone: body.phone,
        email: body.email,
        date_of_birth: body.date_of_birth ? new Date(body.date_of_birth) : null,
        assigned_vehicle_id: body.assigned_vehicle_id ? parseInt(body.assigned_vehicle_id) : null,
        notes: body.notes,
        // Documentos
        driver_license_front: body.driver_license_front,
        driver_license_back: body.driver_license_back,
        id_document_front: body.id_document_front,
        id_document_back: body.id_document_back,
      }
    });

    // Regenerar contrato si no está firmado
    const bookingId = parseInt(params.id);
    try {
      await regenerateContractIfNotSigned(
        bookingId, 
        `Modificado conductor: ${body.full_name}`,
        (session.user as any)?.email || 'system'
      );
    } catch (contractError) {
      console.error('Error regenerando contrato:', contractError);
    }

    return NextResponse.json(driver);
  } catch (error) {
    console.error('Error updating driver:', error);
    return NextResponse.json(
      { error: 'Error al actualizar conductor' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar conductor
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; driverId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const driverId = parseInt(params.driverId);

    // Obtener datos del conductor antes de eliminarlo (para el log)
    const driver = await prisma.bookingDrivers.findUnique({
      where: { id: driverId }
    });

    await prisma.bookingDrivers.delete({
      where: {
        id: driverId
      }
    });

    // Regenerar contrato si no está firmado
    if (driver) {
      const bookingId = parseInt(params.id);
      try {
        await regenerateContractIfNotSigned(
          bookingId, 
          `Eliminado conductor: ${driver.full_name}`,
          (session.user as any)?.email || 'system'
        );
      } catch (contractError) {
        console.error('Error regenerando contrato:', contractError);
      }
    }

    return NextResponse.json({ message: 'Conductor eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    return NextResponse.json(
      { error: 'Error al eliminar conductor' },
      { status: 500 }
    );
  }
}
