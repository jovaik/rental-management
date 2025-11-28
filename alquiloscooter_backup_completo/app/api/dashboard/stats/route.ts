

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getVehicleWhereClause, getBookingWhereClause, getMaintenanceWhereClause } from '@/lib/role-filters';
import { UserRole } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly'; // today, weekly, monthly, yearly

    const userRole = session.user.role as UserRole;
    const userId = parseInt(session.user.id);
    
    const vehicleWhere = getVehicleWhereClause({ userId, userRole });
    const bookingWhere = getBookingWhereClause({ userId, userRole });
    const maintenanceWhere = getMaintenanceWhereClause({ userId, userRole });

    const now = new Date();
    let startDate: Date;
    let groupBy: 'day' | 'week' | 'month' | 'year' = 'month';

    // Determine date range based on period
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        groupBy = 'day';
        break;
      case 'weekly':
        // Calcular el lunes de esta semana (semanas van de lunes a domingo)
        const dayOfWeek = now.getDay(); // 0 = domingo, 1 = lunes, etc.
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Si es domingo, retroceder 6 días
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday);
        startDate.setHours(0, 0, 0, 0); // Inicio del día
        groupBy = 'day';
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        groupBy = 'day';
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        groupBy = 'month';
        break;
      default:
        startDate = new Date(now.getFullYear(), 0, 1); // Current year
        groupBy = 'month';
    }

    // Obtener reservas confirmadas/completadas para calcular ingresos
    // CORREGIDO: Usamos total_price de bookings directamente
    const bookings = await prisma.carRentalBookings.findMany({
      where: {
        ...bookingWhere,
        status: { in: ['confirmed', 'completed'] },
        pickup_date: {
          gte: startDate
        }
      },
      select: {
        pickup_date: true,
        total_price: true
      }
    });

    // Get maintenance expenses
    const expenses = await prisma.carRentalMaintenanceExpenses.findMany({
      where: {
        maintenance: maintenanceWhere,
        created_at: {
          gte: startDate
        }
      },
      select: {
        created_at: true,
        total_price: true
      }
    });

    // Group data by period
    const revenueByPeriod: Record<string, number> = {};
    const expensesByPeriod: Record<string, number> = {};

    // Procesar reservas confirmadas/completadas para ingresos
    bookings.forEach((booking: any) => {
      const date = new Date(booking.pickup_date || new Date());
      let key: string;
      
      if (groupBy === 'day') {
        key = `${date.getDate()}/${date.getMonth() + 1}`;
      } else if (groupBy === 'month') {
        key = date.toLocaleDateString('es-ES', { month: 'short' });
      } else {
        key = date.getFullYear().toString();
      }

      revenueByPeriod[key] = (revenueByPeriod[key] || 0) + parseFloat(booking.total_price?.toString() || '0');
    });

    // Process expenses
    expenses.forEach((expense: any) => {
      const date = new Date(expense.created_at || new Date());
      let key: string;
      
      if (groupBy === 'day') {
        key = `${date.getDate()}/${date.getMonth() + 1}`;
      } else if (groupBy === 'month') {
        key = date.toLocaleDateString('es-ES', { month: 'short' });
      } else {
        key = date.getFullYear().toString();
      }

      expensesByPeriod[key] = (expensesByPeriod[key] || 0) + parseFloat(expense.total_price?.toString() || '0');
    });

    // Get most rented vehicles
    const vehicleBookings = await prisma.carRentalBookings.findMany({
      where: {
        ...bookingWhere,
        pickup_date: {
          gte: new Date(now.getFullYear(), 0, 1) // Current year
        },
        status: { in: ['confirmed', 'completed'] }
      },
      select: {
        car_id: true,
        car: {
          select: {
            id: true,
            registration_number: true,
            make: true,
            model: true,
            pricing_group_id: true,
            pricingGroup: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Count bookings by vehicle
    const vehicleCounts: Record<string, { count: number; vehicle: any }> = {};
    
    vehicleBookings.forEach(booking => {
      if (booking.car_id && booking.car) {
        const key = booking.car_id.toString();
        if (!vehicleCounts[key]) {
          vehicleCounts[key] = {
            count: 0,
            vehicle: booking.car
          };
        }
        vehicleCounts[key].count++;
      }
    });

    // Sort and get top 5
    const topVehicles = Object.values(vehicleCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => ({
        ...item.vehicle,
        bookings: item.count
      }));

    return NextResponse.json({
      revenueByPeriod,
      expensesByPeriod,
      topVehicles,
      period
    });

  } catch (error) {
    console.error('Dashboard stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
