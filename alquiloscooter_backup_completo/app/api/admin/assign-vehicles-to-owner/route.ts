
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * Endpoint para asignar masivamente vehículos a un propietario específico
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized - Solo super_admin puede usar este endpoint' }, { status: 401 });
    }

    const { ownerEmail } = await request.json();

    if (!ownerEmail) {
      return NextResponse.json({ 
        error: 'ownerEmail es requerido' 
      }, { status: 400 });
    }

    // Buscar el usuario propietario por email
    const owner = await prisma.carRentalUsers.findUnique({
      where: { email: ownerEmail }
    });

    if (!owner) {
      return NextResponse.json({ 
        error: `No se encontró usuario con email: ${ownerEmail}` 
      }, { status: 404 });
    }

    if (owner.role !== 'propietario') {
      return NextResponse.json({ 
        error: `El usuario ${ownerEmail} no tiene rol de propietario. Rol actual: ${owner.role}` 
      }, { status: 400 });
    }

    // Buscar vehículos sin propietario asignado
    const vehiclesWithoutOwner = await prisma.carRentalCars.findMany({
      where: {
        owner_user_id: null
      }
    });

    if (vehiclesWithoutOwner.length === 0) {
      return NextResponse.json({ 
        message: 'No hay vehículos sin propietario asignado',
        vehiclesUpdated: 0
      });
    }

    // Asignar todos los vehículos sin propietario a este usuario
    const result = await prisma.carRentalCars.updateMany({
      where: {
        owner_user_id: null
      },
      data: {
        owner_user_id: owner.id
      }
    });

    return NextResponse.json({ 
      success: true,
      message: `Se asignaron ${result.count} vehículos al propietario ${owner.firstname} ${owner.lastname} (${ownerEmail})`,
      vehiclesUpdated: result.count,
      owner: {
        id: owner.id,
        name: `${owner.firstname} ${owner.lastname}`,
        email: owner.email
      }
    });

  } catch (error: any) {
    console.error('Error asignando vehículos:', error);
    return NextResponse.json(
      { error: 'Error al asignar vehículos', details: error.message },
      { status: 500 }
    );
  }
}
