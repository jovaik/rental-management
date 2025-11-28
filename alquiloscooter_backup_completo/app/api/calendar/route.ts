
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

    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const whereClause: any = {};

    if (start && end) {
      whereClause.start_datetime = {
        gte: new Date(start),
        lte: new Date(end)
      };
    }

    // Get calendar events
    const calendarEvents = await prisma.carRentalCalendarEvents.findMany({
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
        location: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { start_datetime: 'asc' }
    });

    // Also get active bookings as calendar events
    const bookings = await prisma.carRentalBookings.findMany({
      where: {
        pickup_date: start ? { gte: new Date(start) } : undefined,
        return_date: end ? { lte: new Date(end) } : undefined,
        status: 'confirmed'
      },
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
    });

    // Convert bookings to calendar events format
    const bookingEvents = bookings.map((booking: any) => ({
      id: `booking_${booking.id}`,
      title: `Reserva: ${booking?.customer_name || 'Cliente'}`,
      event_type: 'booking',
      reference_id: booking.id,
      car_id: booking?.car_id,
      start_datetime: booking?.pickup_date,
      end_datetime: booking?.return_date,
      color: '#10b981',
      status: booking?.status,
      priority: 'medium',
      description: `Cliente: ${booking?.customer_name || 'N/A'}\nTeléfono: ${booking?.customer_phone || 'N/A'}`,
      car: booking?.car
    }));

    const allEvents = [
      ...calendarEvents,
      ...bookingEvents
    ];

    return NextResponse.json(allEvents);

  } catch (error) {
    console.error('Calendar API error:', error);
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
    
    const event = await prisma.carRentalCalendarEvents.create({
      data: {
        ...body,
        created_by: parseInt(session.user?.id || '0'),
        created_at: new Date(),
        updated_at: new Date()
      },
      include: {
        car: {
          select: { id: true, registration_number: true, make: true, model: true }
        }
      }
    });

    return NextResponse.json(event);

  } catch (error) {
    console.error('Calendar event creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
