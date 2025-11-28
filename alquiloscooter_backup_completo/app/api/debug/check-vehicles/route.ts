import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getVehicleWhereClause } from '@/lib/role-filters';
import { UserRole } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const userRole = session.user.role as UserRole;

    // Obtener la cláusula WHERE que se está usando
    const whereClause = getVehicleWhereClause({
      userId,
      userRole
    });

    // Obtener todos los vehículos con owner_user_id
    const allVehicles = await prisma.carRentalCars.findMany({
      select: {
        id: true,
        registration_number: true,
        make: true,
        model: true,
        owner_user_id: true,
        depositor_user_id: true,
        status: true
      }
    });

    // Vehículos que deberían ver según filtro usando la función
    const vehiclesForUser = await prisma.carRentalCars.findMany({
      where: whereClause,
      select: {
        id: true,
        registration_number: true,
        make: true,
        model: true,
        owner_user_id: true,
        depositor_user_id: true,
        status: true
      }
    });

    // Vehículos asignados a este usuario específicamente
    const vehiclesOwnedByUser = allVehicles.filter((v: any) => v.owner_user_id === userId);
    const vehiclesDepositedByUser = allVehicles.filter((v: any) => v.depositor_user_id === userId);

    return NextResponse.json({
      session: {
        userId,
        userRole,
        email: session.user.email
      },
      whereClause,
      counts: {
        totalVehicles: allVehicles.length,
        vehiclesForUserCount: vehiclesForUser.length,
        vehiclesOwnedByUser: vehiclesOwnedByUser.length,
        vehiclesDepositedByUser: vehiclesDepositedByUser.length
      },
      lists: {
        allVehiclesList: allVehicles,
        vehiclesForUserList: vehiclesForUser,
        vehiclesOwnedByUserList: vehiclesOwnedByUser,
        vehiclesDepositedByUserList: vehiclesDepositedByUser
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ 
      error: 'Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
