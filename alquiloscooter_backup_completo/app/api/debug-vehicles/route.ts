
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const totalCount = await prisma.carRentalCars.count();
    
    const vehicles = await prisma.carRentalCars.findMany({
      select: {
        id: true,
        registration_number: true,
        make: true,
        model: true,
        year: true,
        status: true,
        pricing_group_id: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({
      totalCount,
      vehicles,
      message: `Found ${vehicles.length} vehicles in database`
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Database error',
        message: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
