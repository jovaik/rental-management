import { requireAuth, getTenantFromSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CustomerCard } from '@/components/customers/CustomerCard';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function CustomerDetailPage({
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
    notFound();
  }

  // Serialize data for client component
  const customerData = {
    ...customer,
    address: customer.address || undefined,
    city: customer.city || undefined,
    country: customer.country || undefined,
    notes: customer.notes || undefined,
    createdAt: customer.createdAt.toISOString(),
    bookings: customer.bookings.map(booking => ({
      ...booking,
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
    })),
  };

  return (
    <div>
      <Link
        href="/customers"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a clientes
      </Link>
      <CustomerCard customer={customerData} />
    </div>
  );
}
