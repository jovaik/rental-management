
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role as any;
    const userId = parseInt(session.user.id);

    const { searchParams } = new URL(request.url);
    const maintenanceId = searchParams.get('maintenanceId');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const offset = (page - 1) * limit;

    const whereClause: any = {};

    // Aplicar filtros basados en el rol
    if (userRole === 'propietario') {
      // Solo gastos de vehículos propios
      whereClause.maintenance = {
        car: {
          owner_user_id: userId
        }
      };
    } else if (userRole === 'colaborador') {
      // Solo gastos de vehículos en depósito
      whereClause.maintenance = {
        car: {
          depositor_user_id: userId
        }
      };
    } else if (userRole === 'taller') {
      // Solo gastos de vehículos asignados al taller
      // Nota: Necesitarías workshop_location en la sesión para esto
      whereClause.maintenance = {
        car: {
          assigned_to: session.user.email // o workshop_location si está disponible
        }
      };
    }

    if (maintenanceId) {
      whereClause.maintenance_id = parseInt(maintenanceId);
    }

    if (category) {
      whereClause.expense_category = category;
    }

    const [expenses, total] = await Promise.all([
      prisma.carRentalMaintenanceExpenses.findMany({
        where: whereClause,
        include: {
          maintenance: {
            include: {
              car: {
                select: {
                  id: true,
                  registration_number: true,
                  make: true,
                  model: true
                }
              }
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.carRentalMaintenanceExpenses.count({ where: whereClause })
    ]);

    const result = {
      expenses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Expenses API error:', error);
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
    
    let maintenanceId = body.maintenance_id;
    
    // Si no hay maintenance_id pero hay car_id, crear un mantenimiento automático
    if (!maintenanceId && body.car_id) {
      const maintenance = await prisma.carRentalVehicleMaintenance.create({
        data: {
          car_id: parseInt(body.car_id),
          title: `Gasto: ${body.item_name}`,
          maintenance_type: 'Corrective',
          scheduled_date: new Date(),
          status: 'completed',
          description: `Gasto registrado: ${body.item_name}`,
          created_by: parseInt(session.user.id),
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      maintenanceId = maintenance.id;
    }

    if (!maintenanceId) {
      return NextResponse.json(
        { error: 'Se requiere maintenance_id o car_id' },
        { status: 400 }
      );
    }
    
    const expense = await prisma.carRentalMaintenanceExpenses.create({
      data: {
        maintenance_id: parseInt(maintenanceId),
        expense_category: body.expense_category,
        item_name: body.item_name,
        description: body.description || null,
        quantity: body.quantity ? parseFloat(body.quantity.toString()) : 1,
        unit_price: parseFloat(body.unit_price.toString()),
        total_price: parseFloat(body.total_price.toString()),
        supplier: body.supplier || null,
        invoice_number: body.invoice_number || null,
        purchase_date: body.purchase_date ? new Date(body.purchase_date) : new Date(),
        warranty_months: body.warranty_months ? parseInt(body.warranty_months.toString()) : null,
        created_at: new Date(),
        updated_at: new Date()
      },
      include: {
        maintenance: {
          include: {
            car: {
              select: {
                id: true,
                registration_number: true,
                make: true,
                model: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(expense);

  } catch (error: any) {
    console.error('Expense creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
