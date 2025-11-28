

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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const locationId = searchParams.get('locationId');
    const vehicleId = searchParams.get('vehicleId');

    const userRole = session.user.role as UserRole;
    const userId = parseInt(session.user.id);
    
    const vehicleWhere = getVehicleWhereClause({ userId, userRole });
    const bookingWhere = getBookingWhereClause({ userId, userRole });
    const maintenanceWhere = getMaintenanceWhereClause({ userId, userRole });

    // Base date filters
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Additional filters
    const additionalFilters: any = {};
    if (locationId && locationId !== 'all') {
      additionalFilters.location_id = parseInt(locationId);
    }

    // Get bookings with filters
    const bookings = await prisma.carRentalBookings.findMany({
      where: {
        ...bookingWhere,
        ...(Object.keys(dateFilter).length > 0 && { pickup_date: dateFilter }),
        ...additionalFilters,
        ...(vehicleId && vehicleId !== 'all' && { car_id: parseInt(vehicleId) }),
        status: { in: ['confirmed', 'completed'] }
      },
      include: {
        car: {
          select: {
            id: true,
            registration_number: true,
            make: true,
            model: true,
            pricing_group_id: true,
            location_id: true,
            location: {
              select: {
                id: true,
                name: true
              }
            },
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

    // Get maintenance with filters
    const maintenanceRecords = await prisma.carRentalVehicleMaintenance.findMany({
      where: {
        ...maintenanceWhere,
        ...(Object.keys(dateFilter).length > 0 && { scheduled_date: dateFilter }),
        ...(vehicleId && vehicleId !== 'all' && { car_id: parseInt(vehicleId) })
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
        expenses: true
      }
    });

    // === STATISTICS BY GROUP ===
    const bookingsByGroup: Record<string, { count: number; revenue: number; days: number }> = {};
    bookings.forEach((booking: any) => {
      const group = booking.car?.pricingGroup?.name || 'Sin Grupo';
      if (!bookingsByGroup[group]) {
        bookingsByGroup[group] = { count: 0, revenue: 0, days: 0 };
      }
      bookingsByGroup[group].count++;
      bookingsByGroup[group].revenue += parseFloat(booking.total_price?.toString() || '0');
      
      // Calculate rental days
      const start = new Date(booking.pickup_date || new Date());
      const end = new Date(booking.return_date || new Date());
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      bookingsByGroup[group].days += days;
    });

    // === STATISTICS BY VEHICLE MODEL ===
    const bookingsByModel: Record<string, { count: number; revenue: number; vehicle: any }> = {};
    bookings.forEach((booking: any) => {
      if (booking.car) {
        const key = `${booking.car.make || ''} ${booking.car.model || ''}`;
        if (!bookingsByModel[key]) {
          bookingsByModel[key] = { 
            count: 0, 
            revenue: 0,
            vehicle: {
              make: booking.car.make,
              model: booking.car.model,
              pricingGroup: booking.car.pricingGroup?.name
            }
          };
        }
        bookingsByModel[key].count++;
        bookingsByModel[key].revenue += parseFloat(booking.total_price?.toString() || '0');
      }
    });

    // === STATISTICS BY LOCATION ===
    const bookingsByLocation: Record<string, { count: number; revenue: number; location: string }> = {};
    bookings.forEach((booking: any) => {
      if (booking.car?.location) {
        const locationName = booking.car.location.name || 'Sin ubicación';
        if (!bookingsByLocation[locationName]) {
          bookingsByLocation[locationName] = { count: 0, revenue: 0, location: locationName };
        }
        bookingsByLocation[locationName].count++;
        bookingsByLocation[locationName].revenue += parseFloat(booking.total_price?.toString() || '0');
      }
    });

    // === MAINTENANCE COSTS BY VEHICLE ===
    const maintenanceCostsByVehicle: Record<string, { costs: number; count: number; vehicle: any }> = {};
    maintenanceRecords.forEach((maintenance: any) => {
      if (maintenance.car && maintenance.car.registration_number) {
        const key = maintenance.car.registration_number;
        if (!maintenanceCostsByVehicle[key]) {
          maintenanceCostsByVehicle[key] = {
            costs: 0,
            count: 0,
            vehicle: {
              id: maintenance.car.id,
              registration_number: maintenance.car.registration_number,
              make: maintenance.car.make,
              model: maintenance.car.model
            }
          };
        }
        maintenanceCostsByVehicle[key].count++;
        
        // Sum all expenses for this maintenance
        const totalExpenses = maintenance.expenses.reduce((sum: number, exp: any) => {
          return sum + parseFloat(exp.total_price?.toString() || '0');
        }, 0);
        maintenanceCostsByVehicle[key].costs += totalExpenses;
      }
    });

    // === RENTAL DURATION ANALYSIS ===
    const rentalDurations: number[] = [];
    bookings.forEach((booking: any) => {
      const start = new Date(booking.pickup_date);
      const end = new Date(booking.return_date);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      rentalDurations.push(days);
    });

    const avgRentalDuration = rentalDurations.length > 0
      ? rentalDurations.reduce((sum, d) => sum + d, 0) / rentalDurations.length
      : 0;

    // === PEAK HOURS ANALYSIS ===
    const bookingsByHour: Record<number, number> = {};
    bookings.forEach((booking: any) => {
      const hour = new Date(booking.pickup_date).getHours();
      bookingsByHour[hour] = (bookingsByHour[hour] || 0) + 1;
    });

    return NextResponse.json({
      summary: {
        totalBookings: bookings.length,
        totalRevenue: bookings.reduce((sum: number, b: any) => sum + parseFloat(b.total_price?.toString() || '0'), 0),
        totalMaintenanceRecords: maintenanceRecords.length,
        totalMaintenanceCosts: Object.values(maintenanceCostsByVehicle).reduce((sum, v) => sum + v.costs, 0),
        avgRentalDuration: Math.round(avgRentalDuration * 10) / 10
      },
      bookingsByGroup,
      bookingsByModel,
      bookingsByLocation,
      maintenanceCostsByVehicle,
      bookingsByHour
    });

  } catch (error) {
    console.error('Statistics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
