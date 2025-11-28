

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

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

    // Check if vehicle exists
    const vehicle = await prisma.carRentalCars.findUnique({
      where: { id: vehicleId }
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 });
    }

    // Get all documents for this vehicle
    const documents = await prisma.carRentalVehicleDocuments.findMany({
      where: { car_id: vehicleId },
      include: {
        uploader: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return NextResponse.json(documents);

  } catch (error) {
    console.error('Fetch documents error:', error);
    return NextResponse.json(
      { error: 'Error al obtener documentos' },
      { status: 500 }
    );
  }
}
