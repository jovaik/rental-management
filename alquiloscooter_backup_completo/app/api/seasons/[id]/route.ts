
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    const body = await request.json();

    const season = await prisma.carRentalSeasonConfig.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(season);
  } catch (error) {
    console.error('Error updating season:', error);
    return NextResponse.json({ error: 'Failed to update season' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);

    await prisma.carRentalSeasonConfig.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting season:', error);
    return NextResponse.json({ error: 'Failed to delete season' }, { status: 500 });
  }
}
