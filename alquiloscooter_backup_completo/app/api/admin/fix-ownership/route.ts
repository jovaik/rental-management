
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== 'super_admin' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { vehicleId, ownerId } = await request.json();

    if (!vehicleId || !ownerId) {
      return NextResponse.json({ 
        error: 'vehicleId y ownerId son requeridos' 
      }, { status: 400 });
    }

    // Actualizar el vehículo con el propietario
    const vehicle = await prisma.carRentalCars.update({
      where: { id: parseInt(vehicleId) },
      data: {
        owner_user_id: parseInt(ownerId)
      }
    });

    return NextResponse.json({ 
      success: true, 
      vehicle 
    });

  } catch (error: any) {
    console.error('Error actualizando propietario:', error);
    return NextResponse.json(
      { error: 'Error al actualizar propietario', details: error.message },
      { status: 500 }
    );
  }
}
