import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ItemCard } from '@/components/items/ItemCard';
import { notFound } from 'next/navigation';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function ItemDetailPage({ params }: PageProps) {
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ItemCard item={item} />
      </div>
    </div>
  );
}
