import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getTenantFromSession } from '@/lib/auth';
import { z } from 'zod';

// Validation schema
const createBookingSchema = z.object({
  itemId: z.string().min(1, 'Item es requerido'),
  customerId: z.string().min(1, 'Cliente es requerido'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  totalPrice: z.number().min(0),
  deposit: z.number().min(0).default(0),
  notes: z.string().optional(),
});

// GET /api/bookings - List all bookings with filters
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const tenantId = await getTenantFromSession();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant no encontrado' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const itemId = searchParams.get('itemId');
    const customerId = searchParams.get('customerId');

    // Build where clause
    const where: any = { tenantId };

    if (status) {
      where.status = status;
    }

    if (itemId) {
      where.itemId = itemId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (search) {
      where.OR = [
        { item: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        item: {
          select: {
            id: true,
            name: true,
            type: true,
            basePrice: true,
            photos: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate statistics
    const stats = {
      total: bookings.length,
      pending: bookings.filter((b) => b.status === 'PENDING').length,
      confirmed: bookings.filter((b) => b.status === 'CONFIRMED').length,
      inProgress: bookings.filter((b) => b.status === 'IN_PROGRESS').length,
      completed: bookings.filter((b) => b.status === 'COMPLETED').length,
      cancelled: bookings.filter((b) => b.status === 'CANCELLED').length,
    };

    return NextResponse.json({ bookings, stats });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Error al obtener las reservas' },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Create new booking
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
    const data = createBookingSchema.parse(body);

    // Verify item exists and belongs to tenant
    const item = await prisma.item.findFirst({
      where: {
        id: data.itemId,
        tenantId,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item no encontrado' },
        { status: 404 }
      );
    }

    // Verify customer exists and belongs to tenant
    const customer = await prisma.customer.findFirst({
      where: {
        id: data.customerId,
        tenantId,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Check availability
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'La fecha de fin debe ser posterior a la fecha de inicio' },
        { status: 400 }
      );
    }

    const overlappingBookings = await prisma.booking.findMany({
      where: {
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
      },
    });

    if (overlappingBookings.length > 0) {
      return NextResponse.json(
        { error: 'El item no está disponible en las fechas seleccionadas' },
        { status: 409 }
      );
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        tenantId,
        itemId: data.itemId,
        customerId: data.customerId,
        startDate,
        endDate,
        totalPrice: data.totalPrice,
        deposit: data.deposit,
        notes: data.notes,
        status: 'PENDING',
      },
      include: {
        item: true,
        customer: true,
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Error al crear la reserva' },
      { status: 500 }
    );
  }
}
