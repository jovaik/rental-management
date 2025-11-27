import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ItemForm } from '@/components/items/ItemForm';
import { notFound } from 'next/navigation';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function EditItemPage({ params }: PageProps) {
  const session = await requireAuth();
  const tenantId = session.user.tenant_id;

  const item = await prisma.item.findFirst({
    where: {
      id: params.id,
      tenantId,
    },
  });

  if (!item) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Item</h1>
          <p className="mt-2 text-sm text-gray-600">
            Update item information
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <ItemForm mode="edit" initialData={item} />
        </div>
      </div>
    </div>
  );
}
