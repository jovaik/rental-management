
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Obtener lista de modelos únicos de vehículos (Marca + Modelo)
export async function GET(request: NextRequest) {
  try {
    const vehicles = await prisma.carRentalCars.findMany({
      where: {
        status: 'T', // Solo vehículos activos
        make: { not: null },
        model: { not: null }
      },
      select: {
        make: true,
        model: true
      },
      distinct: ['make', 'model'],
      orderBy: [
        { make: 'asc' },
        { model: 'asc' }
      ]
    });

    // Combinar marca + modelo
    const models = vehicles
      .filter((v: any) => v.make && v.model)
      .map((v: any) => `${v.make} ${v.model}`.trim())
      .filter((value: any, index: number, self: any[]) => self.indexOf(value) === index) // Eliminar duplicados
      .sort();

    return NextResponse.json(models);
  } catch (error: any) {
    console.error('Error fetching vehicle models:', error);
    return NextResponse.json(
      { error: 'Error al obtener modelos de vehículos' },
      { status: 500 }
    );
  }
}
