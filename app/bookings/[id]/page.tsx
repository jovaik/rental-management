import { requireAuth, getTenantFromSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import BookingCard from '@/components/bookings/BookingCard';
import Link from 'next/link';

export const metadata = {
  title: 'Detalle de Reserva - Rental Management',
};

async function getBooking(id: string, tenantId: string) {
  const booking = await prisma.booking.findFirst({
    where: {
      id,
      tenantId,
    },
    include: {
      Item: {
        select: {
          id: true,
          name: true,
          type: true,
          basePrice: true,
          photos: true,
          attributes: true,
        },
      },
      Customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          documentType: true,
          documentNumber: true,
        },
      },
    },
  });

  if (!booking) {
    notFound();
  }

  return booking;
}

export default async function BookingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAuth();
  const tenantId = await getTenantFromSession();

  if (!tenantId) {
    return <div>Error: Tenant no encontrado</div>;
  }

  const booking = await getBooking(params.id, tenantId);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/bookings"
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
        >
          &larr; Volver a Reservas
        </Link>
      </div>

      <BookingCard booking={booking as any} />
    </div>
  );
}
