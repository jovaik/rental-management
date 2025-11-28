import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getTenantFromSession } from '@/lib/auth';
import { z } from 'zod';

// Validation schema
const createCustomerSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'Teléfono es requerido'),
  documentType: z.enum(['DNI', 'NIE', 'PASSPORT', 'DRIVING_LICENSE']),
  documentNumber: z.string().min(1, 'Número de documento es requerido'),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/customers - List all customers with filters
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
    const search = searchParams.get('search');

    // Build where clause
    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { documentNumber: { contains: search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: { Booking: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Error al obtener los clientes' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create new customer
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
    const data = createCustomerSchema.parse(body);

    // Check if email already exists for this tenant
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        tenantId,
        email: data.email,
      },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Ya existe un cliente con este email' },
        { status: 409 }
      );
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        address: data.address,
        city: data.city,
        country: data.country,
        notes: data.notes,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Error al crear el cliente' },
      { status: 500 }
    );
  }
}
