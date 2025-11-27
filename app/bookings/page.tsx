import { Suspense } from 'react';
import Link from 'next/link';
import { requireAuth, getTenantFromSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import BookingList from '@/components/bookings/BookingList';

export const metadata = {
  title: 'Reservas - Rental Management',
  description: 'Gestiona tus reservas',
};

async function getBookings(tenantId: string) {
  const bookings = await prisma.booking.findMany({
    where: { tenantId },
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
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'PENDING').length,
    confirmed: bookings.filter((b) => b.status === 'CONFIRMED').length,
    inProgress: bookings.filter((b) => b.status === 'IN_PROGRESS').length,
    completed: bookings.filter((b) => b.status === 'COMPLETED').length,
    cancelled: bookings.filter((b) => b.status === 'CANCELLED').length,
  };

  return { bookings, stats };
}

export default async function BookingsPage() {
  await requireAuth();
  const tenantId = await getTenantFromSession();

  if (!tenantId) {
    return <div>Error: Tenant no encontrado</div>;
  }

  const { bookings, stats } = await getBookings(tenantId);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Reservas</h1>
          <p className="text-gray-600 mt-1">
            Gestiona todas las reservas de tus items
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/bookings/calendar"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition"
          >
            Ver Calendario
          </Link>
          <Link
            href="/bookings/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
          >
            + Nueva Reserva
          </Link>
        </div>
      </div>

      <Suspense fallback={<div>Cargando reservas...</div>}>
        <BookingList initialBookings={bookings as any} initialStats={stats} />
      </Suspense>
    </div>
  );
}
