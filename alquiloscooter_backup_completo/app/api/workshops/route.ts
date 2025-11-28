
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Obtener todos los talleres activos desde BusinessLocations
export async function GET() {
  try {
    // Obtener las ubicaciones de negocio tipo "workshop" que estén activas
    const workshops = await prisma.businessLocations.findMany({
      where: {
        type: 'workshop',
        active: true
      },
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        type: true,
        address: true,
        city: true,
        postal_code: true,
        contact_person: true,
        contact_phone: true,
        contact_email: true,
        user_id: true,
        notes: true,
        active: true,
        created_at: true,
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

    return NextResponse.json(workshops);
  } catch (error) {
    console.error('Error fetching workshops:', error);
    return NextResponse.json(
      { error: 'Error al cargar talleres' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo taller en BusinessLocations
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const workshop = await prisma.businessLocations.create({
      data: {
        name: body.name,
        type: 'workshop',
        contact_person: body.contact_person || body.contact_name,
        contact_phone: body.contact_phone || body.phone,
        contact_email: body.contact_email || body.email,
        address: body.address,
        city: body.city,
        postal_code: body.postal_code,
        country: body.country || 'España',
        user_id: body.user_id || null,
        notes: body.notes,
        active: body.active ?? body.is_active ?? true
      }
    });

    return NextResponse.json(workshop);
  } catch (error) {
    console.error('Error creating workshop:', error);
    return NextResponse.json(
      { error: 'Error al crear taller' },
      { status: 500 }
    );
  }
}
