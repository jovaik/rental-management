import { requireAuth, getTenantFromSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { InvoiceList } from '@/components/invoices/InvoiceList';

export default async function InvoicesPage() {
  await requireAuth();
  const tenantId = await getTenantFromSession();

  if (!tenantId) {
    return <div>Error: Tenant no encontrado</div>;
  }

  const invoices = await prisma.invoice.findMany({
    where: { tenantId },
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

  // Serialize dates for client component
  const invoicesData = invoices.map(invoice => ({
    ...invoice,
    createdAt: invoice.createdAt.toISOString(),
  }));

  return <InvoiceList initialInvoices={invoicesData} initialStats={stats} />;
}
