
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();
    
    const allBookings = await prisma.carRentalBookings.findMany({
      where: {
        status: { in: ['confirmed', 'pending'] }
      },
      include: {
        vehicles: {
          include: {
            car: {
              select: {
                registration_number: true
              }
            }
          }
        }
      },
      orderBy: { pickup_date: 'asc' }
    });
    
    const bookingsWithStatus = allBookings.map((b: any) => {
      const pickup = new Date(b.pickup_date);
      const returnDate = new Date(b.return_date);
      const isActive = pickup <= now && returnDate >= now;
      
      return {
        id: b.id,
        status: b.status,
        customer_name: b.customer_name,
        pickup_date: pickup.toISOString(),
        return_date: returnDate.toISOString(),
        is_active_now: isActive,
        vehicles: b.vehicles?.map((v: any) => v.car.registration_number) || []
      };
    });
    
    const activeCount = bookingsWithStatus.filter((b: any) => b.is_active_now).length;
    
    return NextResponse.json({
      current_time: now.toISOString(),
      total_bookings: bookingsWithStatus.length,
      active_bookings_count: activeCount,
      bookings: bookingsWithStatus
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
