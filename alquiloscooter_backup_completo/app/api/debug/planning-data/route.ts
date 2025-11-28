
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

    // Obtener las fechas de los parámetros
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    // Cargar vehículos activos
    const vehicles = await prisma.carRentalCars.findMany({
      where: {
        status: 'T'
      },
      select: {
        id: true,
        registration_number: true,
        make: true,
        model: true,
        status: true
      },
      orderBy: {
        registration_number: 'asc'
      }
    });

    // Cargar reservas confirmadas y pendientes
    const whereClause: any = {
      status: { in: ['confirmed', 'pending'] }
    };

    if (start && end) {
      whereClause.OR = [
        {
          pickup_date: {
            gte: new Date(start),
            lte: new Date(end)
          }
        },
        {
          return_date: {
            gte: new Date(start),
            lte: new Date(end)
          }
        },
        {
          AND: [
            { pickup_date: { lte: new Date(start) } },
            { return_date: { gte: new Date(end) } }
          ]
        }
      ];
    }

    const bookings = await prisma.carRentalBookings.findMany({
      where: whereClause,
      include: {
        car: {
          select: {
            id: true,
            registration_number: true,
            make: true,
            model: true
          }
        }
      },
      orderBy: {
        pickup_date: 'asc'
      }
    });

    // Estadísticas de debug
    const stats = {
      totalVehicles: vehicles.length,
      activeVehicles: vehicles.filter((v: any) => v.status === 'T').length,
      totalBookings: bookings.length,
      confirmedBookings: bookings.filter((b: any) => b.status === 'confirmed').length,
      pendingBookings: bookings.filter((b: any) => b.status === 'pending').length,
      bookingsWithCar: bookings.filter((b: any) => b.car_id !== null).length,
      bookingsWithoutCar: bookings.filter((b: any) => b.car_id === null).length,
      dateRange: { start, end }
    };

    // Mapeo de reservas por vehículo
    const bookingsByVehicle: Record<number, any[]> = {};
    bookings.forEach((booking: any) => {
      if (booking.car_id) {
        if (!bookingsByVehicle[booking.car_id]) {
          bookingsByVehicle[booking.car_id] = [];
        }
        bookingsByVehicle[booking.car_id].push({
          id: booking.id,
          customer_name: booking.customer_name,
          pickup_date: booking.pickup_date,
          return_date: booking.return_date,
          status: booking.status
        });
      }
    });

    return NextResponse.json({
      success: true,
      stats,
      vehicles: vehicles.map((v: any) => ({
        id: v.id,
        registration_number: v.registration_number,
        make: v.make,
        model: v.model,
        status: v.status,
        bookings: bookingsByVehicle[v.id] || []
      })),
      allBookings: bookings.map((b: any) => ({
        id: b.id,
        car_id: b.car_id,
        car_id_type: typeof b.car_id,
        customer_name: b.customer_name,
        pickup_date: b.pickup_date,
        return_date: b.return_date,
        status: b.status,
        car: b.car
      }))
    });

  } catch (error) {
    console.error('Debug planning data error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
