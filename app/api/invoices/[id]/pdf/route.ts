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
    await requireAuth();
    const tenantId = await getTenantFromSession();
    const { id } = await params;

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
        booking: {
          include: {
            customer: true,
            item: true,
          },
        },
        tenant: true,
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
        startDate: invoice.booking.startDate,
        endDate: invoice.booking.endDate,
        totalPrice: invoice.booking.totalPrice,
        deposit: invoice.booking.deposit,
        notes: invoice.booking.notes,
        item: {
          name: invoice.booking.item.name,
          type: invoice.booking.item.type,
          basePrice: invoice.booking.item.basePrice,
        },
      },
      customer: {
        name: invoice.booking.customer.name,
        email: invoice.booking.customer.email,
        phone: invoice.booking.customer.phone,
        documentType: invoice.booking.customer.documentType,
        documentNumber: invoice.booking.customer.documentNumber,
        address: invoice.booking.customer.address,
        city: invoice.booking.customer.city,
        country: invoice.booking.customer.country,
      },
      tenant: {
        name: invoice.tenant.name,
        location: invoice.tenant.location,
        logo: invoice.tenant.logo,
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
