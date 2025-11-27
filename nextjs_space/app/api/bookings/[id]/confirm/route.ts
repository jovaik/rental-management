import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getTenantFromSession } from '@/lib/auth';
import { generateInvoicePDF } from '@/lib/pdf-generator';
import fs from 'fs';
import path from 'path';

// Helper function to generate invoice number
async function generateInvoiceNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  
  // Count existing invoices for this tenant this year
  const count = await prisma.invoice.count({
    where: {
      tenantId,
      createdAt: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
  });

  const nextNumber = count + 1;
  return `INV-${year}-${String(nextNumber).padStart(4, '0')}`;
}

// POST /api/bookings/[id]/confirm - Confirm booking and generate invoice
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

    // Verify booking exists and belongs to tenant
    const booking = await prisma.booking.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        customer: true,
        item: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Check if booking is already confirmed
    if (booking.status === 'CONFIRMED') {
      return NextResponse.json(
        { error: 'La reserva ya está confirmada' },
        { status: 400 }
      );
    }

    // Check if invoice already exists for this booking
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        bookingId: id,
        tenantId,
      },
    });

    if (existingInvoice) {
      return NextResponse.json(
        { error: 'Ya existe una factura para esta reserva' },
        { status: 400 }
      );
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(tenantId);

    // Get tenant info for PDF
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant no encontrado' },
        { status: 404 }
      );
    }

    // Create transaction to update booking and create invoice
    const result = await prisma.$transaction(async (tx) => {
      // Update booking status
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: { status: 'CONFIRMED' },
      });

      // Create invoice
      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          bookingId: id,
          invoiceNumber,
          amount: booking.totalPrice,
          status: 'PENDING',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
      });

      return { booking: updatedBooking, invoice };
    });

    // Generate PDF asynchronously
    try {
      const pdfBuffer = await generateInvoicePDF({
        invoice: {
          invoiceNumber: result.invoice.invoiceNumber,
          amount: result.invoice.amount,
          status: result.invoice.status,
          createdAt: result.invoice.createdAt,
          dueDate: result.invoice.dueDate,
        },
        booking: {
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalPrice: booking.totalPrice,
          deposit: booking.deposit,
          notes: booking.notes,
          item: {
            name: booking.item.name,
            type: booking.item.type,
            basePrice: booking.item.basePrice,
          },
        },
        customer: {
          name: booking.customer.name,
          email: booking.customer.email,
          phone: booking.customer.phone,
          documentType: booking.customer.documentType,
          documentNumber: booking.customer.documentNumber,
          address: booking.customer.address,
          city: booking.customer.city,
          country: booking.customer.country,
        },
        tenant: {
          name: tenant.name,
          location: tenant.location,
          logo: tenant.logo,
        },
      });

      // Ensure directory exists
      const invoicesDir = path.join(
        process.cwd(),
        'public',
        'invoices',
        `tenant-${tenantId}`
      );
      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
      }

      // Save PDF to file
      const fileName = `${result.invoice.invoiceNumber.replace(/\//g, '-')}.pdf`;
      const filePath = path.join(invoicesDir, fileName);
      fs.writeFileSync(filePath, pdfBuffer);

      // Update invoice with PDF URL
      const pdfUrl = `/invoices/tenant-${tenantId}/${fileName}`;
      await prisma.invoice.update({
        where: { id: result.invoice.id },
        data: { pdfUrl },
      });
    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError);
      // Don't fail the request if PDF generation fails
      // The PDF can be generated later if needed
    }

    return NextResponse.json({
      message: 'Reserva confirmada y factura generada correctamente',
      booking: result.booking,
      invoice: result.invoice,
    });
  } catch (error) {
    console.error('Error confirming booking:', error);
    return NextResponse.json(
      { error: 'Error al confirmar la reserva' },
      { status: 500 }
    );
  }
}
