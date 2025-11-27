import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getTenantFromSession } from '@/lib/auth';

// POST /api/bookings/[id]/confirm - Confirm booking
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
        id: params.id,
        tenantId,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    if (booking.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Solo se pueden confirmar reservas pendientes' },
        { status: 400 }
      );
    }

    const confirmedBooking = await prisma.booking.update({
      where: { id: params.id },
      data: { status: 'CONFIRMED' },
      include: {
        item: true,
        customer: true,
      },
    });

    return NextResponse.json({
      message: 'Reserva confirmada correctamente',
      booking: confirmedBooking,
    });
  } catch (error) {
    console.error('Error confirming booking:', error);
    return NextResponse.json(
      { error: 'Error al confirmar la reserva' },
      { status: 500 }
    );
  }
}
