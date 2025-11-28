
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

    const extras = await prisma.carRentalExtras.findMany({
      where: { is_available: true },
      orderBy: { display_order: 'asc' },
    });

    return NextResponse.json(extras);
  } catch (error) {
    console.error('Error fetching extras:', error);
    return NextResponse.json({ error: 'Error fetching extras' }, { status: 500 });
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
    if (!body.name || body.price === undefined) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      );
    }

    const extra = await prisma.carRentalExtras.create({
      data: {
        name: body.name,
        description: body.description || null,
        extra_type: body.extra_type || 'home_delivery',
        pricing_type: body.pricing_type || 'fixed',
        price: Number(body.price),
        distance_range_min: body.distance_range_min ? Number(body.distance_range_min) : null,
        distance_range_max: body.distance_range_max ? Number(body.distance_range_max) : null,
        is_available: body.is_available !== undefined ? Boolean(body.is_available) : true,
        display_order: body.display_order !== undefined ? Number(body.display_order) : 0,
      },
    });

    console.log('✅ Extra created successfully:', extra.id, extra.name);
    return NextResponse.json(extra, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating extra:', error);
    return NextResponse.json({ error: 'Error creating extra' }, { status: 500 });
  }
}
