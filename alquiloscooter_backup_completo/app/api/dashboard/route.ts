
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

    const userRole = session.user.role as UserRole;
    const userId = parseInt(session.user.id);
    
    // Obtener la cláusula WHERE según el rol del usuario
    const vehicleWhere = getVehicleWhereClause({ userId, userRole });
    const bookingWhere = getBookingWhereClause({ userId, userRole });
    const maintenanceWhere = getMaintenanceWhereClause({ userId, userRole });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1);

    // Get dashboard statistics filtered by role
    const [
      totalVehicles,
      availableVehicles,
      activeBookings,
      totalBookings,
      pendingMaintenance,
      monthlyBookings,
      yearlyBookings,
      maintenanceExpenses
    ] = await Promise.all([
      // Total vehicles (filtered by role)
      prisma.carRentalCars.count({
        where: {
          ...vehicleWhere,
          status: 'T'
        }
      }),
      
      // Available vehicles (filtered by role, not in active bookings)
      prisma.carRentalCars.count({
        where: {
          ...vehicleWhere,
          status: 'T',
          bookings: {
            none: {
              AND: [
                { pickup_date: { lte: now } },
                { return_date: { gte: now } },
                { status: 'confirmed' }
              ]
            }
          }
        }
      }),
      
      // Active bookings (filtered by role) - en curso ahora
      prisma.carRentalBookings.count({
        where: {
          ...bookingWhere,
          AND: [
            { pickup_date: { lte: now } },
            { return_date: { gte: now } },
            { status: 'confirmed' }
          ]
        }
      }),
      
      // Total bookings del año (filtered by role) - TODAS las confirmadas del año
      prisma.carRentalBookings.count({
        where: {
          ...bookingWhere,
          pickup_date: {
            gte: startOfYear,
            lt: endOfYear
          },
          status: 'confirmed'
        }
      }),
      
      // Pending maintenance (filtered by role)
      prisma.carRentalVehicleMaintenance.count({
        where: {
          ...maintenanceWhere,
          status: { in: ['scheduled', 'overdue', 'in_progress'] }
        }
      }),
      
      // Monthly bookings for revenue calculation (filtered by role)
      // CORREGIDO: Usamos total_price de carRentalBookings directamente
      prisma.carRentalBookings.findMany({
        where: {
          ...bookingWhere,
          status: { in: ['confirmed', 'completed'] },
          pickup_date: {
            gte: startOfMonth,
            lt: endOfMonth
          }
        },
        select: { total_price: true }
      }),
      
      // Yearly bookings for revenue calculation (filtered by role)
      // CORREGIDO: Usamos total_price de carRentalBookings directamente
      prisma.carRentalBookings.findMany({
        where: {
          ...bookingWhere,
          status: { in: ['confirmed', 'completed'] },
          pickup_date: {
            gte: startOfYear,
            lt: endOfYear
          }
        },
        select: { total_price: true }
      }),
      
      // Monthly maintenance expenses (filtered by role)
      prisma.carRentalMaintenanceExpenses.findMany({
        where: {
          maintenance: maintenanceWhere,
          created_at: {
            gte: startOfMonth,
            lt: endOfMonth
          }
        },
        select: { total_price: true }
      })
    ]);

    // Calculate monthly revenue from confirmed/completed bookings
    const monthlyRevenue = monthlyBookings.reduce((sum: number, booking: any) => {
      return sum + (parseFloat(booking?.total_price?.toString() || '0'));
    }, 0);

    // Calculate yearly revenue from confirmed/completed bookings
    const yearlyRevenue = yearlyBookings.reduce((sum: number, booking: any) => {
      return sum + (parseFloat(booking?.total_price?.toString() || '0'));
    }, 0);

    // Calculate monthly maintenance costs
    const maintenanceCosts = maintenanceExpenses.reduce((sum: number, expense: any) => {
      return sum + (parseFloat(expense?.total_price?.toString() || '0'));
    }, 0);

    // Calculate utilization rate
    const vehicleUtilization = totalVehicles > 0 
      ? Math.round(((totalVehicles - availableVehicles) / totalVehicles) * 100)
      : 0;

    const stats = {
      totalVehicles,
      availableVehicles,
      activeBookings,
      totalBookings,
      pendingMaintenance,
      monthlyRevenue,
      yearlyRevenue,
      maintenanceCosts,
      vehicleUtilization
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
