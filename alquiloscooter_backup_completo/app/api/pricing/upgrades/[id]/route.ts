
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

    const upgrade = await prisma.carRentalUpgrades.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(upgrade);
  } catch (error) {
    console.error('Error updating upgrade:', error);
    return NextResponse.json({ error: 'Failed to update upgrade' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);

    await prisma.carRentalUpgrades.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting upgrade:', error);
    return NextResponse.json({ error: 'Failed to delete upgrade' }, { status: 500 });
  }
}
