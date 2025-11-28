import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getTenantFromSession } from '@/lib/auth';

// POST /api/bookings/[id]/start - Start booking (mark as IN_PROGRESS)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireAuth();
    const tenantId = await getTenantFromSession();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant no encontrado' },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: id,
        tenantId,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    if (booking.status !== 'CONFIRMED') {
      return NextResponse.json(
        { error: 'Solo se pueden iniciar reservas confirmadas' },
        { status: 400 }
      );
    }

    const startedBooking = await prisma.booking.update({
      where: { id: id },
      data: { status: 'IN_PROGRESS' },
      include: {
        Item: true,
        Customer: true,
      },
    });

    // Update item status to RENTED
    await prisma.item.update({
      where: { id: booking.itemId },
      data: { status: 'RENTED' },
    });

    return NextResponse.json({
      message: 'Reserva iniciada correctamente',
      booking: startedBooking,
    });
  } catch (error) {
    console.error('Error starting booking:', error);
    return NextResponse.json(
      { error: 'Error al iniciar la reserva' },
      { status: 500 }
    );
  }
}
