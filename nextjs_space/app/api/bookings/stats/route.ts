import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getTenantFromSession } from '@/lib/auth';

// GET /api/bookings/stats - Get booking statistics
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const tenantId = await getTenantFromSession();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant no encontrado' },
        { status: 400 }
      );
    }

    // Get all bookings for stats
    const bookings = await prisma.booking.findMany({
      where: { tenantId },
      include: {
        item: true,
      },
    });

    // Calculate statistics
    const stats = {
      total: bookings.length,
      pending: bookings.filter((b) => b.status === 'PENDING').length,
      confirmed: bookings.filter((b) => b.status === 'CONFIRMED').length,
      inProgress: bookings.filter((b) => b.status === 'IN_PROGRESS').length,
      completed: bookings.filter((b) => b.status === 'COMPLETED').length,
      cancelled: bookings.filter((b) => b.status === 'CANCELLED').length,
      totalRevenue: bookings
        .filter((b) => b.status === 'COMPLETED')
        .reduce((sum, b) => sum + b.totalPrice, 0),
      pendingRevenue: bookings
        .filter((b) => ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status))
        .reduce((sum, b) => sum + b.totalPrice, 0),
    };

    // Get upcoming bookings (next 7 days)
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingBookings = await prisma.booking.findMany({
      where: {
        tenantId,
        startDate: {
          gte: today,
          lte: nextWeek,
        },
        status: {
          notIn: ['CANCELLED', 'COMPLETED'],
        },
      },
      include: {
        item: {
          select: {
            name: true,
            type: true,
          },
        },
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
      take: 5,
    });

    // Get bookings by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const bookingsByMonth = await prisma.booking.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        createdAt: true,
        status: true,
        totalPrice: true,
      },
    });

    // Group by month
    const monthlyData = bookingsByMonth.reduce((acc: any, booking) => {
      const month = booking.createdAt.toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { count: 0, revenue: 0 };
      }
      acc[month].count += 1;
      if (booking.status === 'COMPLETED') {
        acc[month].revenue += booking.totalPrice;
      }
      return acc;
    }, {});

    return NextResponse.json({
      stats,
      upcomingBookings,
      monthlyData,
    });
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener las estadísticas' },
      { status: 500 }
    );
  }
}
