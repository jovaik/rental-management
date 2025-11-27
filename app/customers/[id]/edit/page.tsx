import { requireAuth, getTenantFromSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function EditCustomerPage({
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
  });

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/customers/${id}`}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al cliente
        </Link>
        <h1 className="text-2xl font-bold">Editar Cliente</h1>
        <p className="text-gray-600 mt-1">Actualiza la información del cliente</p>
      </div>
      <CustomerForm
        initialData={{
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          documentType: customer.documentType,
          documentNumber: customer.documentNumber,
          address: customer.address || undefined,
          city: customer.city || undefined,
          country: customer.country || undefined,
          notes: customer.notes || undefined,
        }}
        customerId={id}
      />
    </div>
  );
}
