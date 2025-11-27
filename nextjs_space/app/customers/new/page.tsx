import { requireAuth } from '@/lib/auth';
import { CustomerForm } from '@/components/customers/CustomerForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function NewCustomerPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/customers"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a clientes
        </Link>
        <h1 className="text-2xl font-bold">Nuevo Cliente</h1>
        <p className="text-gray-600 mt-1">Añade un nuevo cliente a tu base de datos</p>
      </div>
      <CustomerForm />
    </div>
  );
}
