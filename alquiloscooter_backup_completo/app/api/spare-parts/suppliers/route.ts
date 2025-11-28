
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Obtener lista única de proveedores
export async function GET(request: NextRequest) {
  try {
    const spareParts = await prisma.carRentalSpareParts.findMany({
      where: {
        supplier: { not: null }
      },
      select: {
        supplier: true
      },
      distinct: ['supplier'],
      orderBy: {
        supplier: 'asc'
      }
    });

    // Normalizar y eliminar duplicados considerando espacios y mayúsculas
    const suppliersSet = new Set<string>();
    const normalizedSuppliers: string[] = [];
    
    spareParts.forEach((sp: any) => {
      if (sp.supplier) {
        // Normalizar: eliminar espacios extras y convertir a minúsculas para comparación
        const normalized = sp.supplier.trim().toLowerCase();
        
        // Solo agregar si no existe una versión normalizada igual
        if (!suppliersSet.has(normalized)) {
          suppliersSet.add(normalized);
          // Agregar el valor original (pero con trim)
          normalizedSuppliers.push(sp.supplier.trim());
        }
      }
    });

    // Ordenar alfabéticamente
    normalizedSuppliers.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

    return NextResponse.json(normalizedSuppliers);
  } catch (error: any) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'Error al obtener proveedores' },
      { status: 500 }
    );
  }
}
