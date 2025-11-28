
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Obtener un repuesto específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    const sparePart = await prisma.carRentalSpareParts.findUnique({
      where: { id }
    });

    if (!sparePart) {
      return NextResponse.json(
        { error: 'Repuesto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(sparePart);
  } catch (error: any) {
    console.error('Error fetching spare part:', error);
    return NextResponse.json(
      { error: 'Error al obtener repuesto' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar repuesto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    
    const {
      vehicle_model,
      part_name,
      part_code,
      part_category,
      price,
      supplier,
      supplier_code,
      notes,
      is_active
    } = body;

    // Validaciones
    if (vehicle_model && !vehicle_model.trim()) {
      return NextResponse.json(
        { error: 'El modelo de vehículo no puede estar vacío' },
        { status: 400 }
      );
    }

    if (part_name && !part_name.trim()) {
      return NextResponse.json(
        { error: 'El nombre del repuesto no puede estar vacío' },
        { status: 400 }
      );
    }

    if (price !== undefined && parseFloat(price) < 0) {
      return NextResponse.json(
        { error: 'El precio debe ser un valor positivo' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    
    if (vehicle_model !== undefined) updateData.vehicle_model = vehicle_model.trim();
    if (part_name !== undefined) updateData.part_name = part_name.trim();
    if (part_code !== undefined) updateData.part_code = part_code?.trim() || null;
    if (part_category !== undefined) updateData.part_category = part_category;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (supplier !== undefined) updateData.supplier = supplier?.trim() || null;
    if (supplier_code !== undefined) updateData.supplier_code = supplier_code?.trim() || null;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;
    if (is_active !== undefined) updateData.is_active = is_active;

    const sparePart = await prisma.carRentalSpareParts.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(sparePart);
  } catch (error: any) {
    console.error('Error updating spare part:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Repuesto no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al actualizar repuesto' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar repuesto (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    // Soft delete - marcamos como inactivo
    const sparePart = await prisma.carRentalSpareParts.update({
      where: { id },
      data: { is_active: false }
    });

    return NextResponse.json({ 
      message: 'Repuesto eliminado correctamente',
      sparePart 
    });
  } catch (error: any) {
    console.error('Error deleting spare part:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Repuesto no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al eliminar repuesto' },
      { status: 500 }
    );
  }
}
