
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Obtener taller por ID desde BusinessLocations
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const workshop = await prisma.businessLocations.findUnique({
      where: {
        id: parseInt(params.id)
      },
      include: {
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true
          }
        }
      }
    });

    if (!workshop || workshop.type !== 'workshop') {
      return NextResponse.json(
        { error: 'Taller no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(workshop);
  } catch (error) {
    console.error('Error fetching workshop:', error);
    return NextResponse.json(
      { error: 'Error al cargar taller' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar taller en BusinessLocations
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const workshop = await prisma.businessLocations.update({
      where: {
        id: parseInt(params.id)
      },
      data: {
        name: body.name,
        contact_person: body.contact_person || body.contact_name,
        contact_phone: body.contact_phone || body.phone,
        contact_email: body.contact_email || body.email,
        address: body.address,
        city: body.city,
        postal_code: body.postal_code,
        country: body.country,
        user_id: body.user_id,
        notes: body.notes,
        active: body.active ?? body.is_active
      }
    });

    return NextResponse.json(workshop);
  } catch (error) {
    console.error('Error updating workshop:', error);
    return NextResponse.json(
      { error: 'Error al actualizar taller' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar taller (soft delete) en BusinessLocations
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.businessLocations.update({
      where: {
        id: parseInt(params.id)
      },
      data: {
        active: false
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workshop:', error);
    return NextResponse.json(
      { error: 'Error al eliminar taller' },
      { status: 500 }
    );
  }
}
