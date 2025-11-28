export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();
    
    console.log('=== DEBUG VEHICLE STATUS ===');
    console.log('Current time:', now.toISOString());
    
    // Buscar el vehiculo especifico
    const vehicle = await prisma.carRentalCars.findFirst({
      where: {
        registration_number: {
          contains: '3807GHX'
        }
      },
      include: {
        bookings: {
          where: {
            status: { in: ['confirmed', 'pending'] }
          },
          select: {
            id: true,
            customer_name: true,
            pickup_date: true,
            return_date: true,
            status: true
          },
          orderBy: { pickup_date: 'desc' }
        }
      }
    });
    
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' });
    }
    
    // Verificar reservas activas con el filtro de la API
    const activeBookingsViaAPI = await prisma.carRentalCars.findFirst({
      where: { id: vehicle.id },
      include: {
        bookings: {
          where: {
            status: { in: ['confirmed', 'pending'] },
            pickup_date: { lte: now },
            return_date: { gte: now }
          },
          select: {
            id: true,
            customer_name: true,
            pickup_date: true,
            return_date: true,
            status: true
          }
        }
      }
    });
    
    const result = {
      current_time: now.toISOString(),
      vehicle: {
        id: vehicle.id,
        registration_number: vehicle.registration_number,
        status: vehicle.status
      },
      all_bookings: vehicle.bookings.map((b: any) => ({
        id: b.id,
        customer_name: b.customer_name,
        status: b.status,
        pickup_date: b.pickup_date?.toISOString(),
        return_date: b.return_date?.toISOString(),
        is_active: b.pickup_date && b.return_date && 
                   new Date(b.pickup_date) <= now && 
                   new Date(b.return_date) >= now
      })),
      active_bookings_via_api_filter: activeBookingsViaAPI?.bookings || []
    };
    
    console.log('Result:', JSON.stringify(result, null, 2));
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
