
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Listar repuestos (con filtro opcional por modelo)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const model = searchParams.get('model');
    
    const where: any = {
      is_active: true
    };
    
    if (model) {
      where.vehicle_model = {
        contains: model,
        mode: 'insensitive'
      };
    }
    
    const spareParts = await prisma.carRentalSpareParts.findMany({
      where,
      orderBy: [
        { vehicle_model: 'asc' },
        { part_category: 'asc' },
        { part_name: 'asc' }
      ]
    });

    return NextResponse.json(spareParts);
  } catch (error: any) {
    console.error('Error fetching spare parts:', error);
    return NextResponse.json(
      { error: 'Error al obtener repuestos' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo repuesto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      vehicle_model,
      part_name,
      part_code,
      part_category,
      price,
      supplier,
      supplier_code,
      notes
    } = body;

    // Validaciones
    if (!vehicle_model || !part_name || !price) {
      return NextResponse.json(
        { error: 'Modelo de vehículo, nombre del repuesto y precio son obligatorios' },
        { status: 400 }
      );
    }

    if (parseFloat(price) < 0) {
      return NextResponse.json(
        { error: 'El precio debe ser un valor positivo' },
        { status: 400 }
      );
    }

    const sparePart = await prisma.carRentalSpareParts.create({
      data: {
        vehicle_model: vehicle_model.trim(),
        part_name: part_name.trim(),
        part_code: part_code?.trim() || null,
        part_category: part_category || 'otros',
        price: parseFloat(price),
        supplier: supplier?.trim() || null,
        supplier_code: supplier_code?.trim() || null,
        notes: notes?.trim() || null,
        is_active: true
      }
    });

    return NextResponse.json(sparePart, { status: 201 });
  } catch (error: any) {
    console.error('Error creating spare part:', error);
    return NextResponse.json(
      { error: 'Error al crear repuesto' },
      { status: 500 }
    );
  }
}
