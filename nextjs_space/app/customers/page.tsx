import { requireAuth, getTenantFromSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CustomerList } from '@/components/customers/CustomerList';

export default async function CustomersPage() {
  await requireAuth();
  const tenantId = await getTenantFromSession();

  if (!tenantId) {
    return <div>Error: Tenant no encontrado</div>;
  }

  const customers = await prisma.customer.findMany({
    where: { tenantId },
    include: {
      _count: {
        select: { bookings: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Convert dates to strings for client component
  const customersData = customers.map(customer => ({
    ...customer,
    createdAt: customer.createdAt.toISOString(),
  }));

  return <CustomerList initialCustomers={customersData} />;
}
