
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

    const workingHours = await prisma.carRentalWorkingHours.findMany({
      orderBy: { day_of_week: 'asc' },
    });

    return NextResponse.json(workingHours);
  } catch (error) {
    console.error('Error fetching working hours:', error);
    return NextResponse.json({ error: 'Error fetching working hours' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const workingHour = await prisma.carRentalWorkingHours.upsert({
      where: { day_of_week: data.day_of_week },
      update: data,
      create: data,
    });

    return NextResponse.json(workingHour);
  } catch (error) {
    console.error('Error creating/updating working hours:', error);
    return NextResponse.json({ error: 'Error creating/updating working hours' }, { status: 500 });
  }
}
