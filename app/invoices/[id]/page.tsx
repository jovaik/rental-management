import { requireAuth, getTenantFromSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { InvoiceCard } from '@/components/invoices/InvoiceCard';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const tenantId = await getTenantFromSession();
  const { id } = await params;

  if (!tenantId) {
    return <div>Error: Tenant no encontrado</div>;
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
    notFound();
  }

  // Serialize dates for client component
  const invoiceData = {
    ...invoice,
    createdAt: invoice.createdAt.toISOString(),
    dueDate: invoice.dueDate?.toISOString() || null,
    paidAt: invoice.paidAt?.toISOString() || null,
    booking: {
      ...invoice.booking,
      startDate: invoice.booking.startDate.toISOString(),
      endDate: invoice.booking.endDate.toISOString(),
      notes: invoice.booking.notes || null,
    },
  };

  return (
    <div>
      <Link
        href="/invoices"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a facturas
      </Link>
      <InvoiceCard invoice={invoiceData} />
    </div>
  );
}
