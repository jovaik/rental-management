

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

    console.log('=== FETCHING VEHICLES FOR PRICING GROUP ASSIGNMENT ===');

    // First, let's count all vehicles in the database
    const totalCount = await prisma.carRentalCars.count();
    console.log(`Total vehicles in database: ${totalCount}`);

    // Get all vehicles (not just active ones) for now to debug
    const vehicles = await prisma.carRentalCars.findMany({
      select: {
        id: true,
        registration_number: true,
        make: true,
        model: true,
        year: true,
        status: true,
        pricing_group_id: true,
        owner_user_id: true,  // ✅ CRÍTICO: Necesario para asignación masiva
        depositor_user_id: true,  // ✅ CRÍTICO: Necesario para asignación masiva
        pricingGroup: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { 
        created_at: 'desc'
      }
    });

    console.log(`Found ${vehicles.length} vehicles after query`);
    if (vehicles.length > 0) {
      console.log('Vehicle details:');
      vehicles.forEach((v: any) => {
        console.log(`  - ID: ${v.id}, Reg: ${v.registration_number}, ${v.make} ${v.model} (${v.year}), Status: ${v.status}`);
      });
    } else {
      console.log('NO VEHICLES FOUND - This is the problem!');
    }

    console.log('=== END DEBUG ===');

    return NextResponse.json(vehicles);

  } catch (error) {
    console.error('Vehicles API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
