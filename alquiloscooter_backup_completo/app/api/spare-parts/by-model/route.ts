
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/spare-parts/by-model?model=Honda+Forza - Obtener repuestos por modelo de vehículo
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const vehicleModel = searchParams.get('model');

    if (!vehicleModel) {
      return NextResponse.json(
        { error: 'Falta parámetro "model"' },
        { status: 400 }
      );
    }

    const spareParts = await prisma.carRentalSpareParts.findMany({
      where: {
        vehicle_model: vehicleModel,
        is_active: true
      },
      orderBy: [
        { part_category: 'asc' },
        { part_name: 'asc' }
      ]
    });

    return NextResponse.json(spareParts);
  } catch (error) {
    console.error('Error obteniendo repuestos por modelo:', error);
    return NextResponse.json(
      { error: 'Error obteniendo repuestos' },
      { status: 500 }
    );
  }
}
