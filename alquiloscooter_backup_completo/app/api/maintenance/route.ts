
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getMaintenanceWhereClause } from '@/lib/role-filters';
import { UserRole } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role as UserRole;
    const userId = parseInt(session.user.id);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || '';
    const carId = searchParams.get('carId') || '';

    const offset = (page - 1) * limit;

    // Para usuarios tipo "taller", obtener sus ubicaciones de negocio asociadas
    let businessLocationIds: number[] = [];
    if (userRole === 'taller') {
      const userLocations = await prisma.businessLocations.findMany({
        where: { 
          user_id: userId,
          active: true
        },
        select: { id: true }
      });
      businessLocationIds = userLocations.map((loc: any) => loc.id);
    }

    // Obtener filtros basados en el rol del usuario
    const roleBasedWhere = getMaintenanceWhereClause({ userId, userRole, businessLocationIds });
    
    const whereClause: any = {
      ...roleBasedWhere
    };

    if (status) {
      whereClause.status = status;
    }

    if (carId) {
      whereClause.car_id = parseInt(carId);
    }

    const [maintenance, total] = await Promise.all([
      prisma.carRentalVehicleMaintenance.findMany({
        where: whereClause,
        include: {
          car: {
            select: {
              id: true,
              registration_number: true,
              make: true,
              model: true
            }
          },
          workshop: true,
          expenses: {
            select: {
              id: true,
              expense_category: true,
              item_name: true,
              total_price: true
            }
          }
        },
        orderBy: { scheduled_date: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.carRentalVehicleMaintenance.count({ where: whereClause })
    ]);

    // Transform data to match frontend interface
    const transformedMaintenance = maintenance.map((item: any) => ({
      id: item.id,
      title: item.title,
      maintenance_type: item.maintenance_type,
      scheduled_date: item.scheduled_date,
      completed_date: item.completed_date,
      status: item.status,
      priority: item.priority,
      vehicle: {
        id: item.car.id,
        registration_number: item.car.registration_number,
        make: item.car.make,
        model: item.car.model
      },
      workshop: item.workshop,
      workshop_id: item.workshop_id,
      workshop_location: item.workshop_location,
      // Calcular coste total de los gastos
      estimated_cost: item.expenses?.reduce((sum: number, exp: any) => sum + (parseFloat(exp.total_price?.toString() || '0')), 0) || null,
      actual_cost: item.expenses?.reduce((sum: number, exp: any) => sum + (parseFloat(exp.total_price?.toString() || '0')), 0) || null,
      description: item.description
    }));

    return NextResponse.json(transformedMaintenance);

  } catch (error) {
    console.error('Maintenance API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { expenses, vehicle, workshop, ...maintenanceData } = body;
    
    // Validar campos requeridos
    if (!maintenanceData.title || maintenanceData.title.trim() === '') {
      return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 });
    }
    
    if (!maintenanceData.scheduled_date) {
      return NextResponse.json({ error: 'La fecha programada es obligatoria' }, { status: 400 });
    }
    
    if (!maintenanceData.car_id) {
      return NextResponse.json({ error: 'El vehículo es obligatorio' }, { status: 400 });
    }
    
    // Filtrar solo los campos válidos del esquema de Prisma
    const validFields = [
      'car_id',
      'maintenance_type',
      'title',
      'description',
      'scheduled_date',
      'completed_date',
      'next_maintenance_date',
      'mileage_at_maintenance',
      'next_maintenance_mileage',
      'status',
      'priority',
      'estimated_duration_hours',
      'actual_duration_hours',
      'workshop_id',
      'workshop_location',
      'notes'
    ];
    
    const filteredData: any = {};
    for (const field of validFields) {
      if (maintenanceData[field] !== undefined && maintenanceData[field] !== null && maintenanceData[field] !== '') {
        filteredData[field] = maintenanceData[field];
      }
    }
    
    const maintenance = await prisma.carRentalVehicleMaintenance.create({
      data: {
        ...filteredData,
        created_by: parseInt(session.user?.id || '0'),
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    // Create expenses if provided
    if (expenses && expenses.length > 0) {
      await prisma.carRentalMaintenanceExpenses.createMany({
        data: expenses.map((expense: any) => ({
          ...expense,
          maintenance_id: maintenance.id
        }))
      });
    }

    const result = await prisma.carRentalVehicleMaintenance.findUnique({
      where: { id: maintenance.id },
      include: {
        car: {
          select: { id: true, registration_number: true, make: true, model: true }
        },
        workshop: true,
        expenses: true
      }
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Maintenance creation error:', error);
    
    // Return more specific error messages
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un mantenimiento con estos datos' },
        { status: 409 }
      );
    }
    
    if (error?.code === 'P2003') {
      return NextResponse.json(
        { error: 'El vehículo o taller especificado no existe' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error?.message || 'Error al crear el mantenimiento' },
      { status: 500 }
    );
  }
}
