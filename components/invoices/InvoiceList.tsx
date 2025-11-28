'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Eye, Download, Calendar } from 'lucide-react';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  createdAt: string;
  pdfUrl?: string | null;
  Booking: {
    Customer: {
      id: string;
      name: string;
      email: string;
    };
    Item: {
      id: string;
      name: string;
      type: string;
    };
  };
}

interface InvoiceStats {
  total: number;
  pending: number;
  paid: number;
  cancelled: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

interface InvoiceListProps {
  initialInvoices: Invoice[];
  initialStats: InvoiceStats;
}

export function InvoiceList({ initialInvoices, initialStats }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [stats, setStats] = useState<InvoiceStats>(initialStats);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);

  const handleFilterChange = async (status: string) => {
    setStatusFilter(status);
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (status !== 'ALL') params.append('status', status);

      const response = await fetch(`/api/invoices?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setInvoices(data.invoices);
        setStats(data.stats);
      } else {
        toast.error(data.error || 'Error al filtrar facturas');
      }
    } catch (error) {
      console.error('Error filtering invoices:', error);
      toast.error('Error al filtrar facturas');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`);

      if (!response.ok) {
        toast.error('Error al descargar el PDF');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber.replace(/\//g, '-')}.pdf`;
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Facturas</h1>
          <p className="text-gray-600 mt-1">
            Gestiona las facturas de tus reservas
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Total Facturas</div>
          <div className="text-2xl font-bold mt-1">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Ingresos Totales</div>
          <div className="text-2xl font-bold mt-1">
            €{stats.totalAmount.toFixed(2)}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-green-700">Ingresos Pagados</div>
          <div className="text-2xl font-bold text-green-800 mt-1">
            €{stats.paidAmount.toFixed(2)}
          </div>
          <div className="text-xs text-green-600 mt-1">
            {stats.paid} factura{stats.paid !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-sm text-yellow-700">Ingresos Pendientes</div>
          <div className="text-2xl font-bold text-yellow-800 mt-1">
            €{stats.pendingAmount.toFixed(2)}
          </div>
          <div className="text-xs text-yellow-600 mt-1">
            {stats.pending} factura{stats.pending !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleFilterChange('ALL')}
            className={`px-4 py-2 rounded-lg transition ${
              statusFilter === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => handleFilterChange('PENDING')}
            className={`px-4 py-2 rounded-lg transition ${
              statusFilter === 'PENDING'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => handleFilterChange('PAID')}
            className={`px-4 py-2 rounded-lg transition ${
              statusFilter === 'PAID'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Pagadas
          </button>
          <button
            onClick={() => handleFilterChange('CANCELLED')}
            className={`px-4 py-2 rounded-lg transition ${
              statusFilter === 'CANCELLED'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Canceladas
          </button>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Cargando facturas...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">No hay facturas para mostrar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Número
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Item
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Monto
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-blue-600">
                        {invoice.invoiceNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">
                          {invoice.Booking.Customer.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {invoice.Booking.Customer.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{invoice.Booking.Item.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        €{invoice.amount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(invoice.createdAt), 'dd/MM/yyyy')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() =>
                            handleDownloadPDF(invoice.id, invoice.invoiceNumber)
                          }
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Descargar PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
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
