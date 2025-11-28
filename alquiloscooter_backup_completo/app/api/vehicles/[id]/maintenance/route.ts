
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Obtener mantenimientos de un vehículo
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const maintenanceRecords = await prisma.carRentalVehicleMaintenance.findMany({
      where: {
        car_id: parseInt(params.id)
      },
      include: {
        workshop: true,
        expenses: true,
        creator: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true
          }
        }
      },
      orderBy: {
        scheduled_date: 'desc'
      }
    });

    return NextResponse.json(maintenanceRecords);
  } catch (error) {
    console.error('Error fetching vehicle maintenance:', error);
    return NextResponse.json(
      { error: 'Error al cargar mantenimientos del vehículo' },
      { status: 500 }
    );
  }
}

// POST - Crear mantenimiento para un vehículo
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const maintenance = await prisma.carRentalVehicleMaintenance.create({
      data: {
        car_id: parseInt(params.id),
        maintenance_type: body.maintenance_type,
        title: body.title,
        description: body.description,
        scheduled_date: new Date(body.scheduled_date),
        status: body.status || 'scheduled',
        priority: body.priority || 'medium',
        estimated_duration_hours: body.estimated_duration_hours,
        workshop_id: body.workshop_id ? parseInt(body.workshop_id) : null,
        workshop_location: body.workshop_location,
        notes: body.notes,
        mileage_at_maintenance: body.mileage_at_maintenance,
        next_maintenance_date: body.next_maintenance_date ? new Date(body.next_maintenance_date) : null,
        next_maintenance_mileage: body.next_maintenance_mileage,
        created_by: parseInt(session.user.id),
        created_at: new Date(),
        updated_at: new Date()
      },
      include: {
        workshop: true,
        expenses: true
      }
    });

    return NextResponse.json(maintenance);
  } catch (error) {
    console.error('Error creating vehicle maintenance:', error);
    return NextResponse.json(
      { error: 'Error al crear mantenimiento' },
      { status: 500 }
    );
  }
}
