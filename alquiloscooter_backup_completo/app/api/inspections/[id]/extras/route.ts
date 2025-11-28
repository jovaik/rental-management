
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/inspections/[id]/extras - Añadir extra a una inspección
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: paramId } = await params;
    const inspectionId = parseInt(paramId);

    const body = await request.json();
    const { extraType, description, quantity, size, identifier, notes } = body;

    if (!extraType || !description) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const extra = await prisma.inspectionExtras.create({
      data: {
        inspection_id: inspectionId,
        extra_type: extraType,
        description,
        quantity: quantity || 1,
        size: size || null,
        identifier: identifier || null,
        notes: notes || null
      }
    });

    return NextResponse.json(extra);
  } catch (error) {
    console.error('Error añadiendo extra:', error);
    return NextResponse.json(
      { error: 'Error añadiendo extra' },
      { status: 500 }
    );
  }
}

// DELETE /api/inspections/[id]/extras/[extraId] - Eliminar extra
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const extraId = searchParams.get('extraId');

    if (!extraId) {
      return NextResponse.json({ error: 'Falta extraId' }, { status: 400 });
    }

    await prisma.inspectionExtras.delete({
      where: { id: parseInt(extraId) }
    });

    return NextResponse.json({ message: 'Extra eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando extra:', error);
    return NextResponse.json(
      { error: 'Error eliminando extra' },
      { status: 500 }
    );
  }
}
