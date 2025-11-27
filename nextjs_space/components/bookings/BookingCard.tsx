'use client';

import { Booking } from '@prisma/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type BookingWithRelations = Booking & {
  item: {
    id: string;
    name: string;
    type: string;
    basePrice: number;
    photos: string[];
    attributes: any;
  };
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    documentType: string;
    documentNumber: string;
  };
};

type BookingCardProps = {
  booking: BookingWithRelations;
  onUpdate?: () => void;
};

export default function BookingCard({ booking, onUpdate }: BookingCardProps) {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'CONFIRMED':
        return 'Confirmada';
      case 'IN_PROGRESS':
        return 'En Progreso';
      case 'COMPLETED':
        return 'Completada';
      case 'CANCELLED':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDays = (startDate: Date | string, endDate: Date | string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleAction = async (action: string) => {
    try {
      let url = '';
      let method = 'POST';

      switch (action) {
        case 'confirm':
          url = `/api/bookings/${booking.id}/confirm`;
          break;
        case 'start':
          url = `/api/bookings/${booking.id}/start`;
          break;
        case 'complete':
          url = `/api/bookings/${booking.id}/complete`;
          break;
        case 'cancel':
          if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;
          url = `/api/bookings/${booking.id}`;
          method = 'DELETE';
          break;
      }

      const response = await fetch(url, { method });

      if (response.ok) {
        if (onUpdate) onUpdate();
        router.refresh();
      } else {
        alert('Error al procesar la acción');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar la acción');
    }
  };

  const days = calculateDays(booking.startDate, booking.endDate);

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Reserva #{booking.id.slice(-8)}</h2>
            <p className="text-blue-100 text-sm mt-1">
              Creada el {formatDateTime(booking.createdAt)}
            </p>
          </div>
          <span
            className={`px-4 py-2 text-sm font-semibold rounded-full ${getStatusColor(
              booking.status
            )}`}
          >
            {getStatusText(booking.status)}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Item Information */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Item Reservado</h3>
          <div className="flex items-start space-x-4 bg-gray-50 p-4 rounded-lg">
            {booking.item.photos[0] && (
              <img
                src={booking.item.photos[0]}
                alt={booking.item.name}
                className="w-24 h-24 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <Link
                href={`/items/${booking.item.id}`}
                className="text-lg font-semibold text-blue-600 hover:text-blue-800"
              >
                {booking.item.name}
              </Link>
              <p className="text-sm text-gray-600 mt-1">
                Tipo: {booking.item.type} | Precio Base: €{booking.item.basePrice}/día
              </p>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Información del Cliente</h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Nombre:</span>
              <span className="font-medium">{booking.customer.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{booking.customer.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Teléfono:</span>
              <span className="font-medium">{booking.customer.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Documento:</span>
              <span className="font-medium">
                {booking.customer.documentType} - {booking.customer.documentNumber}
              </span>
            </div>
          </div>
        </div>

        {/* Booking Dates */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Fechas de Reserva</h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Fecha de Inicio:</span>
              <span className="font-medium">{formatDate(booking.startDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fecha de Fin:</span>
              <span className="font-medium">{formatDate(booking.endDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duración:</span>
              <span className="font-medium">{days} días</span>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Información Financiera</h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Precio por Día:</span>
              <span className="font-medium">€{booking.item.basePrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Número de Días:</span>
              <span className="font-medium">{days}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Depósito:</span>
              <span className="font-medium">€{booking.deposit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-lg font-bold text-blue-600">
                €{booking.totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {booking.notes && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Notas</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">{booking.notes}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-4 border-t">
          {booking.status === 'PENDING' && (
            <>
              <button
                onClick={() => handleAction('confirm')}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition"
              >
                Confirmar Reserva
              </button>
              <button
                onClick={() => handleAction('cancel')}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition"
              >
                Cancelar Reserva
              </button>
            </>
          )}
          {booking.status === 'CONFIRMED' && (
            <>
              <button
                onClick={() => handleAction('start')}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition"
              >
                Iniciar Reserva
              </button>
              <button
                onClick={() => handleAction('cancel')}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition"
              >
                Cancelar Reserva
              </button>
            </>
          )}
          {booking.status === 'IN_PROGRESS' && (
            <button
              onClick={() => handleAction('complete')}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition"
            >
              Completar Reserva
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
