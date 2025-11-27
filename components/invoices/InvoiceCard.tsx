'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download, Calendar, FileText, User, Package } from 'lucide-react';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  createdAt: string;
  dueDate?: string | null;
  paidAt?: string | null;
  pdfUrl?: string | null;
  booking: {
    id: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    deposit: number;
    notes?: string | null;
    customer: {
      id: string;
      name: string;
      email: string;
      phone: string;
      documentType: string;
      documentNumber: string;
    };
    item: {
      id: string;
      name: string;
      type: string;
      basePrice: number;
    };
  };
}

interface InvoiceCardProps {
  invoice: Invoice;
}

export function InvoiceCard({ invoice }: InvoiceCardProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);

    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          paidAt: newStatus === 'PAID' ? new Date().toISOString() : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Estado actualizado correctamente');
        router.refresh();
      } else {
        toast.error(data.error || 'Error al actualizar el estado');
      }
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('Error al actualizar el estado');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`);

      if (!response.ok) {
        toast.error('Error al descargar el PDF');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoiceNumber.replace(/\//g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('PDF descargado correctamente');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Error al descargar el PDF');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
          <p className="text-gray-600 mt-1">
            Fecha: {format(new Date(invoice.createdAt), 'PPP', { locale: es })}
          </p>
        </div>
        <div className="flex gap-2">
          <InvoiceStatusBadge status={invoice.status} />
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Download className="w-4 h-4" />
            Descargar PDF
          </button>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Cliente
          </h2>
          <div className="space-y-2">
            <div>
              <div className="text-sm text-gray-600">Nombre</div>
              <Link
                href={`/customers/${invoice.booking.customer.id}`}
                className="font-medium text-blue-600 hover:underline"
              >
                {invoice.booking.customer.name}
              </Link>
            </div>
            <div>
              <div className="text-sm text-gray-600">Email</div>
              <div>{invoice.booking.customer.email}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Teléfono</div>
              <div>{invoice.booking.customer.phone}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Documento</div>
              <div>
                {invoice.booking.customer.documentType}{' '}
                {invoice.booking.customer.documentNumber}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Reserva
          </h2>
          <div className="space-y-2">
            <div>
              <div className="text-sm text-gray-600">Item</div>
              <Link
                href={`/bookings/${invoice.booking.id}`}
                className="font-medium text-blue-600 hover:underline"
              >
                {invoice.booking.item.name}
              </Link>
            </div>
            <div>
              <div className="text-sm text-gray-600">Tipo</div>
              <div>{invoice.booking.item.type}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Período</div>
              <div>
                {format(new Date(invoice.booking.startDate), 'PPP', { locale: es })} -{' '}
                {format(new Date(invoice.booking.endDate), 'PPP', { locale: es })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Details */}
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Detalles Financieros
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Precio Base</span>
            <span className="font-medium">
              €{invoice.booking.totalPrice.toFixed(2)}
            </span>
          </div>
          {invoice.booking.deposit > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Depósito</span>
              <span className="font-medium">
                €{invoice.booking.deposit.toFixed(2)}
              </span>
            </div>
          )}
          <div className="border-t pt-3 flex justify-between">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-lg font-bold text-blue-600">
              €{invoice.amount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Status */}
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Estado de Pago
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Estado Actual</span>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          {invoice.paidAt && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Fecha de Pago</span>
              <span>{format(new Date(invoice.paidAt), 'PPP', { locale: es })}</span>
            </div>
          )}
          {invoice.dueDate && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Fecha de Vencimiento</span>
              <span>{format(new Date(invoice.dueDate), 'PPP', { locale: es })}</span>
            </div>
          )}

          {/* Status Change Actions */}
          {invoice.status === 'PENDING' && (
            <div className="pt-3 border-t">
              <p className="text-sm text-gray-600 mb-2">Actualizar estado:</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusChange('PAID')}
                  disabled={updating}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {updating ? 'Actualizando...' : 'Marcar como Pagada'}
                </button>
                <button
                  onClick={() => handleStatusChange('CANCELLED')}
                  disabled={updating}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {updating ? 'Actualizando...' : 'Cancelar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {invoice.booking.notes && (
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-2">Notas de la Reserva</h2>
          <p className="text-gray-700 whitespace-pre-wrap">
            {invoice.booking.notes}
          </p>
        </div>
      )}
    </div>
  );
}
