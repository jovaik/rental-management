import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getTenantFromSession } from '@/lib/auth';
import { z } from 'zod';

const updateInvoiceSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'CANCELLED', 'REFUNDED']).optional(),
  paidAt: z.string().datetime().optional(),
});

// GET /api/invoices/[id] - Get invoice details
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

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        booking: {
          include: {
            customer: true,
            item: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Error al obtener la factura' },
      { status: 500 }
    );
  }
}

// PUT /api/invoices/[id] - Update invoice status
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
    const data = updateInvoiceSchema.parse(body);

    // Verify invoice exists and belongs to tenant
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: data.status,
        paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
      },
      include: {
        booking: {
          include: {
            customer: true,
            item: true,
          },
        },
      },
    });

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la factura' },
      { status: 500 }
    );
  }
}
