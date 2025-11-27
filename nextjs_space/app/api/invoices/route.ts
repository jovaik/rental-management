import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getTenantFromSession } from '@/lib/auth';

// GET /api/invoices - List all invoices with filters
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

    // Build where clause
    const where: any = { tenantId };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        booking: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            item: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate statistics
    const stats = {
      total: invoices.length,
      pending: invoices.filter((i) => i.status === 'PENDING').length,
      paid: invoices.filter((i) => i.status === 'PAID').length,
      cancelled: invoices.filter((i) => i.status === 'CANCELLED').length,
      totalAmount: invoices.reduce((acc, i) => acc + i.amount, 0),
      paidAmount: invoices
        .filter((i) => i.status === 'PAID')
        .reduce((acc, i) => acc + i.amount, 0),
      pendingAmount: invoices
        .filter((i) => i.status === 'PENDING')
        .reduce((acc, i) => acc + i.amount, 0),
    };

    return NextResponse.json({ invoices, stats });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Error al obtener las facturas' },
      { status: 500 }
    );
  }
}
