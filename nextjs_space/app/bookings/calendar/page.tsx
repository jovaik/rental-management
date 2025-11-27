import { requireAuth } from '@/lib/auth';
import BookingCalendar from '@/components/bookings/BookingCalendar';
import Link from 'next/link';

export const metadata = {
  title: 'Calendario de Reservas - Rental Management',
  description: 'Vista de calendario de todas las reservas',
};

export default async function CalendarPage() {
  await requireAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/bookings"
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
        >
          &larr; Volver a Reservas
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Calendario de Reservas</h1>
            <p className="text-gray-600 mt-1">
              Vista visual de todas las reservas en calendario
            </p>
          </div>
          <Link
            href="/bookings/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
          >
            + Nueva Reserva
          </Link>
        </div>
      </div>

      <BookingCalendar />
    </div>
  );
}
