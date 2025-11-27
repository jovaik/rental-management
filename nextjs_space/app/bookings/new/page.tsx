import { requireAuth } from '@/lib/auth';
import BookingForm from '@/components/bookings/BookingForm';
import Link from 'next/link';

export const metadata = {
  title: 'Nueva Reserva - Rental Management',
  description: 'Crear una nueva reserva',
};

export default async function NewBookingPage() {
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
        <h1 className="text-3xl font-bold">Nueva Reserva</h1>
        <p className="text-gray-600 mt-1">
          Completa el formulario para crear una nueva reserva
        </p>
      </div>

      <BookingForm />
    </div>
  );
}
