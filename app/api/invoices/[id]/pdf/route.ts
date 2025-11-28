import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getTenantFromSession } from '@/lib/auth';
import { generateInvoicePDF } from '@/lib/pdf-generator';
import fs from 'fs';
import path from 'path';

// GET /api/invoices/[id]/pdf - Generate and download invoice PDF
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

    // Get invoice with all related data
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        Booking: {
          include: {
            Customer: true,
            Item: true,
          },
        },
        Tenant: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF({
      invoice: {
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        status: invoice.status,
        createdAt: invoice.createdAt,
        dueDate: invoice.dueDate,
      },
      booking: {
        startDate: invoice.Booking.startDate,
        endDate: invoice.Booking.endDate,
        totalPrice: invoice.Booking.totalPrice,
        deposit: invoice.Booking.deposit,
        notes: invoice.Booking.notes,
        item: {
          name: invoice.Booking.Item.name,
          type: invoice.Booking.Item.type,
          basePrice: invoice.Booking.Item.basePrice,
        },
      },
      customer: {
        name: invoice.Booking.Customer.name,
        email: invoice.Booking.Customer.email,
        phone: invoice.Booking.Customer.phone,
        documentType: invoice.Booking.Customer.documentType,
        documentNumber: invoice.Booking.Customer.documentNumber,
        address: invoice.Booking.Customer.address,
        city: invoice.Booking.Customer.city,
        country: invoice.Booking.Customer.country,
      },
      tenant: {
        name: invoice.Tenant.name,
        location: invoice.Tenant.location,
        logo: invoice.Tenant.logo,
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
    const fileName = `${invoice.invoiceNumber.replace(/\//g, '-')}.pdf`;
    const filePath = path.join(invoicesDir, fileName);
    fs.writeFileSync(filePath, pdfBuffer);

    // Update invoice with PDF URL
    const pdfUrl = `/invoices/tenant-${tenantId}/${fileName}`;
    await prisma.invoice.update({
      where: { id },
      data: { pdfUrl },
    });

    // Return PDF as download
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return NextResponse.json(
      { error: 'Error al generar el PDF de la factura' },
      { status: 500 }
    );
  }
}
