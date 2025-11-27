'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Booking } from '@prisma/client';

type BookingWithRelations = Booking & {
  item: {
    id: string;
    name: string;
    type: string;
    basePrice: number;
    photos: string[];
  };
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
};

type BookingStats = {
  total: number;
  pending: number;
  confirmed: number;
  inProgress: number;
  completed: number;
  cancelled: number;
};

type BookingListProps = {
  initialBookings?: BookingWithRelations[];
  initialStats?: BookingStats;
};

export default function BookingList({ initialBookings, initialStats }: BookingListProps) {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingWithRelations[]>(initialBookings || []);
  const [stats, setStats] = useState<BookingStats>(initialStats || {
    total: 0,
    pending: 0,
    confirmed: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(!initialBookings);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [filter, search]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter.toUpperCase());
      if (search) params.append('search', search);

      const response = await fetch(`/api/bookings?${params}`);
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;

    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchBookings();
      } else {
        alert('Error al cancelar la reserva');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Error al cancelar la reserva');
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      const response = await fetch(`/api/bookings/${id}/confirm`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchBookings();
      } else {
        alert('Error al confirmar la reserva');
      }
    } catch (error) {
      console.error('Error confirming booking:', error);
      alert('Error al confirmar la reserva');
    }
  };

  const handleStart = async (id: string) => {
    try {
      const response = await fetch(`/api/bookings/${id}/start`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchBookings();
      } else {
        alert('Error al iniciar la reserva');
      }
    } catch (error) {
      console.error('Error starting booking:', error);
      alert('Error al iniciar la reserva');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const response = await fetch(`/api/bookings/${id}/complete`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchBookings();
      } else {
        alert('Error al completar la reserva');
      }
    } catch (error) {
      console.error('Error completing booking:', error);
      alert('Error al completar la reserva');
    }
  };

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
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const calculateDays = (startDate: Date | string, endDate: Date | string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow">
          <div className="text-sm text-yellow-700">Pendientes</div>
          <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow">
          <div className="text-sm text-blue-700">Confirmadas</div>
          <div className="text-2xl font-bold text-blue-900">{stats.confirmed}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow">
          <div className="text-sm text-green-700">En Progreso</div>
          <div className="text-2xl font-bold text-green-900">{stats.inProgress}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg shadow">
          <div className="text-sm text-gray-700">Completadas</div>
          <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow">
          <div className="text-sm text-red-700">Canceladas</div>
          <div className="text-2xl font-bold text-red-900">{stats.cancelled}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por item, cliente o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="confirmed">Confirmadas</option>
              <option value="in_progress">En Progreso</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Cargando reservas...</div>
        ) : bookings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay reservas que mostrar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fechas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Días
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {booking.item.photos[0] && (
                          <img
                            src={booking.item.photos[0]}
                            alt={booking.item.name}
                            className="h-10 w-10 rounded object-cover mr-3"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {booking.item.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.item.type}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{booking.customer.name}</div>
                      <div className="text-sm text-gray-500">{booking.customer.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(booking.startDate)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(booking.endDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {calculateDays(booking.startDate, booking.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      €{booking.totalPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {getStatusText(booking.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        href={`/bookings/${booking.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Ver
                      </Link>
                      {booking.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleConfirm(booking.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => handleCancel(booking.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                      {booking.status === 'CONFIRMED' && (
                        <>
                          <button
                            onClick={() => handleStart(booking.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Iniciar
                          </button>
                          <button
                            onClick={() => handleCancel(booking.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                      {booking.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleComplete(booking.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Completar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
