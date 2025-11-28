
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Obtener lista única de modelos de vehículos del catálogo
export async function GET(request: NextRequest) {
  try {
    const spareParts = await prisma.carRentalSpareParts.findMany({
      where: {
        is_active: true
      },
      select: {
        vehicle_model: true
      },
      distinct: ['vehicle_model'],
      orderBy: {
        vehicle_model: 'asc'
      }
    });

    // Normalizar y eliminar duplicados considerando espacios y mayúsculas
    const modelsSet = new Set<string>();
    const normalizedModels: string[] = [];
    
    spareParts.forEach((sp: any) => {
      if (sp.vehicle_model) {
        // Normalizar: eliminar espacios extras y convertir a minúsculas para comparación
        const normalized = sp.vehicle_model.trim().toLowerCase();
        
        // Solo agregar si no existe una versión normalizada igual
        if (!modelsSet.has(normalized)) {
          modelsSet.add(normalized);
          // Agregar el valor original (pero con trim)
          normalizedModels.push(sp.vehicle_model.trim());
        }
      }
    });

    // Ordenar alfabéticamente
    normalizedModels.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

    return NextResponse.json(normalizedModels);
  } catch (error: any) {
    console.error('Error fetching vehicle models:', error);
    return NextResponse.json(
      { error: 'Error al obtener modelos de vehículos' },
      { status: 500 }
    );
  }
}
