
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

    const experiences = await prisma.carRentalExperiences.findMany({
      where: { is_available: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(experiences);
  } catch (error) {
    console.error('Error fetching experiences:', error);
    return NextResponse.json({ error: 'Error fetching experiences' }, { status: 500 });
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
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const experience = await prisma.carRentalExperiences.create({
      data: {
        name: body.name,
        description: body.description || null,
        experience_type: body.experience_type || 'jetski',
        price_per_hour: body.price_per_hour ? Number(body.price_per_hour) : null,
        price_per_day: body.price_per_day ? Number(body.price_per_day) : null,
        price_fixed: body.price_fixed ? Number(body.price_fixed) : null,
        duration_minutes: body.duration_minutes ? Number(body.duration_minutes) : null,
        max_participants: body.max_participants ? Number(body.max_participants) : null,
        min_age: body.min_age ? Number(body.min_age) : null,
        image_url: body.image_url || null,
        is_available: body.is_available !== undefined ? Boolean(body.is_available) : true,
        requires_booking: body.requires_booking !== undefined ? Boolean(body.requires_booking) : true,
        advance_booking_hours: body.advance_booking_hours !== undefined ? Number(body.advance_booking_hours) : 24,
      },
    });

    console.log('✅ Experience created successfully:', experience.id, experience.name);
    return NextResponse.json(experience, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating experience:', error);
    return NextResponse.json({ error: 'Error creating experience' }, { status: 500 });
  }
}
