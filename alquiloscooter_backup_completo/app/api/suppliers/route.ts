
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

// GET - Obtener lista de proveedores con cantidad de repuestos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const suppliers = await prisma.supplier.findMany({
      where: {
        is_active: true
      },
      include: {
        _count: {
          select: {
            spare_parts: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    const result = suppliers.map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      partsCount: supplier._count.spare_parts,
      contactPerson: supplier.contact_person,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      notes: supplier.notes
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'Error al obtener proveedores' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo proveedor
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { newName, contactPerson, phone, email, address, notes } = body;

    if (!newName?.trim()) {
      return NextResponse.json(
        { error: 'El nombre del proveedor es obligatorio' },
        { status: 400 }
      );
    }

    // Verificar si ya existe
    const existing = await prisma.supplier.findFirst({
      where: {
        name: {
          equals: newName.trim(),
          mode: 'insensitive'
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un proveedor con ese nombre' },
        { status: 400 }
      );
    }

    // Crear el proveedor
    const supplier = await prisma.supplier.create({
      data: {
        name: newName.trim(),
        contact_person: contactPerson?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
        is_active: true
      }
    });

    return NextResponse.json({ 
      message: 'Proveedor creado exitosamente',
      id: supplier.id,
      name: supplier.name
    });
  } catch (error: any) {
    console.error('Error creating supplier:', error);
    return NextResponse.json(
      { error: 'Error al crear proveedor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar proveedor
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, newName, contactPerson, phone, email, address, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'El ID del proveedor es obligatorio' },
        { status: 400 }
      );
    }

    if (!newName?.trim()) {
      return NextResponse.json(
        { error: 'El nombre del proveedor es obligatorio' },
        { status: 400 }
      );
    }

    // Verificar si el nuevo nombre ya existe en otro proveedor
    const existing = await prisma.supplier.findFirst({
      where: {
        name: {
          equals: newName.trim(),
          mode: 'insensitive'
        },
        id: {
          not: id
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe otro proveedor con ese nombre' },
        { status: 400 }
      );
    }

    // Actualizar el proveedor
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: newName.trim(),
        contact_person: contactPerson?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null
      }
    });

    return NextResponse.json({ 
      message: 'Proveedor actualizado',
      id: supplier.id,
      name: supplier.name
    });
  } catch (error: any) {
    console.error('Error updating supplier:', error);
    return NextResponse.json(
      { error: 'Error al actualizar proveedor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar proveedor (desactiva y desvincula repuestos)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'El ID del proveedor es obligatorio' },
        { status: 400 }
      );
    }

    // Contar repuestos asignados
    const partsCount = await prisma.carRentalSpareParts.count({
      where: { supplier_id: id }
    });

    // Desvincular repuestos
    await prisma.carRentalSpareParts.updateMany({
      where: { supplier_id: id },
      data: { supplier_id: null }
    });

    // Marcar proveedor como inactivo
    await prisma.supplier.update({
      where: { id },
      data: { is_active: false }
    });

    return NextResponse.json({ 
      message: 'Proveedor eliminado',
      partsCount
    });
  } catch (error: any) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      { error: 'Error al eliminar proveedor' },
      { status: 500 }
    );
  }
}
