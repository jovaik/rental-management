'use client';

import Link from 'next/link';
import { Mail, Phone, FileText, MapPin, Calendar, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Booking {
  id: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
  item: {
    id: string;
    name: string;
    type: string;
    photos: string[];
  };
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  documentType: string;
  documentNumber: string;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
  createdAt: string;
  bookings: Booking[];
}

interface CustomerCardProps {
  customer: Customer;
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export function CustomerCard({ customer }: CustomerCardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <p className="text-gray-600 mt-1">
            Cliente desde {format(new Date(customer.createdAt), 'PPP', { locale: es })}
          </p>
        </div>
        <Link
          href={`/customers/${customer.id}/edit`}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Edit className="w-4 h-4" />
          Editar
        </Link>
      </div>

      {/* Customer Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Información de Contacto</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-600">Email</div>
                <a
                  href={`mailto:${customer.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {customer.email}
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-600">Teléfono</div>
                <a
                  href={`tel:${customer.phone}`}
                  className="text-blue-600 hover:underline"
                >
                  {customer.phone}
                </a>
              </div>
            </div>
            {(customer.address || customer.city || customer.country) && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600">Dirección</div>
                  <div>
                    {customer.address && <div>{customer.address}</div>}
                    {(customer.city || customer.country) && (
                      <div>
                        {customer.city}
                        {customer.city && customer.country && ', '}
                        {customer.country}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Documento de Identidad</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-600">Tipo de Documento</div>
                <div className="font-medium">{customer.documentType}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-600">Número</div>
                <div className="font-medium">{customer.documentNumber}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-600">Total Reservas</div>
                <div className="font-medium">{customer.bookings.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {customer.notes && (
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-2">Notas</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
        </div>
      )}

      {/* Booking History */}
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Historial de Reservas</h2>
        {customer.bookings.length === 0 ? (
          <p className="text-gray-600">No hay reservas registradas</p>
        ) : (
          <div className="space-y-4">
            {customer.bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/bookings/${booking.id}`}
                className="block p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    {booking.item.photos[0] && (
                      <img
                        src={booking.item.photos[0]}
                        alt={booking.item.name}
                        className="w-16 h-16 rounded object-cover"
                      />
                    )}
                    <div>
                      <div className="font-medium">{booking.item.name}</div>
                      <div className="text-sm text-gray-600">
                        {format(new Date(booking.startDate), 'PPP', { locale: es })} -{' '}
                        {format(new Date(booking.endDate), 'PPP', { locale: es })}
                      </div>
                      <div className="text-sm font-medium mt-1">
                        €{booking.totalPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      statusColors[booking.status] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {statusLabels[booking.status] || booking.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
