import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getTenantFromSession } from '@/lib/auth';

// POST /api/bookings/[id]/complete - Complete booking
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

    if (booking.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Solo se pueden completar reservas en progreso' },
        { status: 400 }
      );
    }

    const completedBooking = await prisma.booking.update({
      where: { id: params.id },
      data: { status: 'COMPLETED' },
      include: {
        item: true,
        customer: true,
      },
    });

    // Update item status back to AVAILABLE
    await prisma.item.update({
      where: { id: booking.itemId },
      data: { status: 'AVAILABLE' },
    });

    return NextResponse.json({
      message: 'Reserva completada correctamente',
      booking: completedBooking,
    });
  } catch (error) {
    console.error('Error completing booking:', error);
    return NextResponse.json(
      { error: 'Error al completar la reserva' },
      { status: 500 }
    );
  }
}
