
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const seasons = await prisma.carRentalSeasonConfig.findMany({
      orderBy: { start_month: 'asc' },
    });

    return NextResponse.json(seasons);
  } catch (error) {
    console.error('Error fetching seasons:', error);
    return NextResponse.json({ error: 'Failed to fetch seasons' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const season = await prisma.carRentalSeasonConfig.create({
      data: body,
    });

    return NextResponse.json(season);
  } catch (error) {
    console.error('Error creating season:', error);
    return NextResponse.json({ error: 'Failed to create season' }, { status: 500 });
  }
}
