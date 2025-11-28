import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getTenantFromSession } from '@/lib/auth';
import { z } from 'zod';

const checkAvailabilitySchema = z.object({
  itemId: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  excludeBookingId: z.string().optional(), // For editing existing bookings
});

// POST /api/bookings/check-availability - Check if item is available
export async function POST(request: NextRequest) {
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
    const data = checkAvailabilitySchema.parse(body);

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (startDate >= endDate) {
      return NextResponse.json(
        { 
          available: false, 
          error: 'La fecha de fin debe ser posterior a la fecha de inicio' 
        },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = {
      itemId: data.itemId,
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
    };

    // Exclude specific booking if editing
    if (data.excludeBookingId) {
      where.id = { not: data.excludeBookingId };
    }

    const overlappingBookings = await prisma.booking.findMany({
      where,
      include: {
        Customer: {
          select: {
            name: true,
          },
        },
      },
    });

    const available = overlappingBookings.length === 0;

    return NextResponse.json({
      available,
      conflicts: available ? [] : overlappingBookings,
      message: available
        ? 'Item disponible en las fechas seleccionadas'
        : 'Item no disponible. Hay reservas que se solapan.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Error al verificar disponibilidad' },
      { status: 500 }
    );
  }
}
