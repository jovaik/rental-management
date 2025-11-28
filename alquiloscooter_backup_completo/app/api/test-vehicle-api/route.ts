export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();
    
    // Replicar la logica de la API de vehiculos
    const vehicle = await prisma.carRentalCars.findFirst({
      where: {
        registration_number: {
          contains: '3807GHX'
        }
      },
      include: {
        bookingVehicles: {
          where: {
            booking: {
              status: { in: ['confirmed', 'pending'] },
              pickup_date: { lte: now },
              return_date: { gte: now }
            }
          },
          include: {
            booking: {
              select: {
                id: true,
                customer_name: true,
                pickup_date: true,
                return_date: true,
                status: true
              }
            }
          }
        }
      }
    });
    
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' });
    }
    
    const currentBooking = vehicle.bookingVehicles && vehicle.bookingVehicles.length > 0 
      ? vehicle.bookingVehicles[0].booking 
      : null;
    
    return NextResponse.json({
      vehicle_id: vehicle.id,
      registration_number: vehicle.registration_number,
      status: vehicle.status,
      bookingVehicles_count: vehicle.bookingVehicles?.length || 0,
      currentBooking: currentBooking,
      has_active_booking: currentBooking !== null,
      should_show_as_rented: currentBooking !== null
    });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
