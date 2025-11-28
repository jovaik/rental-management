
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const vehicles = await prisma.carRentalCars.findMany({
      select: {
        id: true,
        registration_number: true,
        make: true,
        model: true,
        status: true,
        pricing_group_id: true
      }
    });
    
    return NextResponse.json({
      total: vehicles.length,
      vehicles: vehicles
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Error fetching vehicles',
      details: error?.message 
    }, { status: 500 });
  }
}
