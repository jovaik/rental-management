
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pricingGroups = await prisma.carRentalPricingGroups.findMany({
      where: { status: 'active' },
      include: {
        vehicles: {
          select: {
            id: true,
            registration_number: true,
            make: true,
            model: true
          }
        }
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(pricingGroups);
  } catch (error) {
    console.error('Error fetching pricing groups:', error);
    return NextResponse.json({ error: 'Error fetching pricing groups' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Create the pricing group
    const pricingGroup = await prisma.carRentalPricingGroups.create({
      data: {
        name: data.name,
        description: data.description,
        vehicle_category_id: data.vehicle_category,
        price_1_3_days: data.price_1_3_days,
        price_4_7_days: data.price_4_7_days,
        price_8_plus_days: data.price_8_plus_days,
        price_monthly_high: data.price_monthly_high,
        price_monthly_low: data.price_monthly_low,
        price_annual_full: data.price_annual_full,
        low_season_multiplier: data.low_season_multiplier || 0.7,
        min_months_high_season: data.min_months_high_season || 3,
        min_months_low_season: data.min_months_low_season || 1,
        min_months_full_year: data.min_months_full_year || 12,
        deposit_amount: data.deposit_amount || 0,
        extra_km_charge: data.extra_km_charge || 0,
        included_km_per_day: data.included_km_per_day || 0,
        status: 'active'
      },
    });

    // Assign vehicles if vehicle_ids is provided
    if (data.vehicle_ids && Array.isArray(data.vehicle_ids) && data.vehicle_ids.length > 0) {
      await prisma.carRentalCars.updateMany({
        where: { 
          id: { in: data.vehicle_ids }
          // Removed status filter to allow all vehicles
        },
        data: { pricing_group_id: pricingGroup.id }
      });
    }

    // Return the created group with vehicles
    const groupWithVehicles = await prisma.carRentalPricingGroups.findUnique({
      where: { id: pricingGroup.id },
      include: {
        vehicles: {
          select: {
            id: true,
            registration_number: true,
            make: true,
            model: true
          }
        }
      }
    });

    return NextResponse.json(groupWithVehicles);
  } catch (error) {
    console.error('Error creating pricing group:', error);
    return NextResponse.json({ error: 'Error creating pricing group' }, { status: 500 });
  }
}
