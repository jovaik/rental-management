
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

    const extra = await prisma.carRentalExtras.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(extra);
  } catch (error) {
    console.error('Error updating extra:', error);
    return NextResponse.json({ error: 'Failed to update extra' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);

    await prisma.carRentalExtras.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting extra:', error);
    return NextResponse.json({ error: 'Failed to delete extra' }, { status: 500 });
  }
}
