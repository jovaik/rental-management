
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const maintenanceId = parseInt((await params).id);

    const maintenance = await prisma.carRentalVehicleMaintenance.findUnique({
      where: { id: maintenanceId },
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
        expenses: true
      }
    });

    if (!maintenance) {
      return NextResponse.json({ error: 'Maintenance not found' }, { status: 404 });
    }

    return NextResponse.json(maintenance);

  } catch (error) {
    console.error('Maintenance fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const maintenanceId = parseInt((await params).id);
    const body = await request.json();

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
      if (body[field] !== undefined) {
        filteredData[field] = body[field];
      }
    }

    const maintenance = await prisma.carRentalVehicleMaintenance.update({
      where: { id: maintenanceId },
      data: {
        ...filteredData,
        updated_at: new Date()
      },
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
        expenses: true
      }
    });

    return NextResponse.json(maintenance);

  } catch (error: any) {
    console.error('Maintenance update error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const maintenanceId = parseInt((await params).id);
    const body = await request.json();
    const { expenses, ...maintenanceData } = body;

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
      if (maintenanceData[field] !== undefined) {
        filteredData[field] = maintenanceData[field];
      }
    }

    const maintenance = await prisma.carRentalVehicleMaintenance.update({
      where: { id: maintenanceId },
      data: {
        ...filteredData,
        updated_at: new Date()
      }
    });

    // Update expenses if provided
    if (expenses) {
      await prisma.carRentalMaintenanceExpenses.deleteMany({
        where: { maintenance_id: maintenanceId }
      });

      if (expenses.length > 0) {
        await prisma.carRentalMaintenanceExpenses.createMany({
          data: expenses.map((expense: any) => ({
            ...expense,
            maintenance_id: maintenanceId
          }))
        });
      }
    }

    const result = await prisma.carRentalVehicleMaintenance.findUnique({
      where: { id: maintenanceId },
      include: {
        car: {
          select: { id: true, registration_number: true, make: true, model: true }
        },
        workshop: true,
        expenses: true
      }
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Maintenance update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const maintenanceId = parseInt((await params).id);

    // Delete associated expenses first
    await prisma.carRentalMaintenanceExpenses.deleteMany({
      where: { maintenance_id: maintenanceId }
    });

    // Delete the maintenance record
    await prisma.carRentalVehicleMaintenance.delete({
      where: { id: maintenanceId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Maintenance delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
