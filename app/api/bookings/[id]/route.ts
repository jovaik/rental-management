import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getTenantFromSession } from '@/lib/auth';
import { z } from 'zod';

const updateBookingSchema = z.object({
  itemId: z.string().optional(),
  customerId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  totalPrice: z.number().min(0).optional(),
  deposit: z.number().min(0).optional(),
  notes: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

// GET /api/bookings/[id] - Get booking by ID
export async function GET(
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
      include: {
        item: {
          select: {
            id: true,
            name: true,
            type: true,
            basePrice: true,
            photos: true,
            attributes: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            documentType: true,
            documentNumber: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { error: 'Error al obtener la reserva' },
      { status: 500 }
    );
  }
}

// PUT /api/bookings/[id] - Update booking
export async function PUT(
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

    const body = await request.json();
    const data = updateBookingSchema.parse(body);

    // Verify booking exists and belongs to tenant
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // If updating dates, check availability
    if (data.startDate || data.endDate) {
      const startDate = data.startDate
        ? new Date(data.startDate)
        : existingBooking.startDate;
      const endDate = data.endDate
        ? new Date(data.endDate)
        : existingBooking.endDate;

      if (startDate >= endDate) {
        return NextResponse.json(
          { error: 'La fecha de fin debe ser posterior a la fecha de inicio' },
          { status: 400 }
        );
      }

      const itemId = data.itemId || existingBooking.itemId;

      const overlappingBookings = await prisma.booking.findMany({
        where: {
          itemId,
          id: { not: params.id }, // Exclude current booking
          status: {
            notIn: ['CANCELLED', 'COMPLETED'],
          },
          OR: [
            {
              AND: [
                { startDate: { lte: endDate } },
                { endDate: { gte: startDate } },
              ],
            },
          ],
        },
      });

      if (overlappingBookings.length > 0) {
        return NextResponse.json(
          { error: 'El item no está disponible en las fechas seleccionadas' },
          { status: 409 }
        );
      }
    }

    // Update booking
    const updateData: any = {};

    if (data.itemId) updateData.itemId = data.itemId;
    if (data.customerId) updateData.customerId = data.customerId;
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.totalPrice !== undefined) updateData.totalPrice = data.totalPrice;
    if (data.deposit !== undefined) updateData.deposit = data.deposit;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status) updateData.status = data.status;

    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: updateData,
      include: {
        item: true,
        customer: true,
      },
    });

    return NextResponse.json(booking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la reserva' },
      { status: 500 }
    );
  }
}

// DELETE /api/bookings/[id] - Cancel booking
export async function DELETE(
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

    // Cancel booking instead of deleting
    const cancelledBooking = await prisma.booking.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({
      message: 'Reserva cancelada correctamente',
      booking: cancelledBooking,
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      { error: 'Error al cancelar la reserva' },
      { status: 500 }
    );
  }
}
