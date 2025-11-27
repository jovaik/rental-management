import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getTenantFromSession } from '@/lib/auth';
import { z } from 'zod';

const updateCustomerSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido').optional(),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().min(1, 'Teléfono es requerido').optional(),
  documentType: z.enum(['DNI', 'NIE', 'PASSPORT', 'DRIVING_LICENSE']).optional(),
  documentNumber: z.string().min(1, 'Número de documento es requerido').optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/customers/[id] - Get customer with booking history
export async function GET(
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

    const customer = await prisma.customer.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        bookings: {
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
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Error al obtener el cliente' },
      { status: 500 }
    );
  }
}

// PUT /api/customers/[id] - Update customer
export async function PUT(
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

    const body = await request.json();
    const data = updateCustomerSchema.parse(body);

    // Verify customer exists and belongs to tenant
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it already exists
    if (data.email && data.email !== customer.email) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          tenantId,
          email: data.email,
          id: { not: id },
        },
      });

      if (existingCustomer) {
        return NextResponse.json(
          { error: 'Ya existe un cliente con este email' },
          { status: 409 }
        );
      }
    }

    // Update customer
    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data,
    });

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el cliente' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id] - Delete customer (only if no bookings)
export async function DELETE(
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

    // Verify customer exists and belongs to tenant
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Check if customer has bookings
    if (customer._count.bookings > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un cliente con reservas existentes' },
        { status: 400 }
      );
    }

    // Delete customer
    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el cliente' },
      { status: 500 }
    );
  }
}
