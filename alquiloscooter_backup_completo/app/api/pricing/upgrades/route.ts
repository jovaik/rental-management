
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

    const upgrades = await prisma.carRentalUpgrades.findMany({
      where: { is_available: true },
      orderBy: { display_order: 'asc' },
    });

    return NextResponse.json(upgrades);
  } catch (error) {
    console.error('Error fetching upgrades:', error);
    return NextResponse.json({ error: 'Error fetching upgrades' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || body.fee_per_day === undefined) {
      return NextResponse.json(
        { error: 'Name and fee_per_day are required' },
        { status: 400 }
      );
    }

    const upgrade = await prisma.carRentalUpgrades.create({
      data: {
        name: body.name,
        description: body.description || null,
        upgrade_type: body.upgrade_type || 'unlimited_km',
        fee_per_day: Number(body.fee_per_day),
        is_available: body.is_available !== undefined ? Boolean(body.is_available) : true,
        display_order: body.display_order !== undefined ? Number(body.display_order) : 0,
      },
    });

    console.log('✅ Upgrade created successfully:', upgrade.id, upgrade.name);
    return NextResponse.json(upgrade, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating upgrade:', error);
    return NextResponse.json({ error: 'Error creating upgrade' }, { status: 500 });
  }
}
