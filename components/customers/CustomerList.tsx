'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, UserPlus, Mail, Phone, Eye, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  documentType: string;
  documentNumber: string;
  createdAt: string;
  _count: {
    bookings: number;
  };
}

interface CustomerListProps {
  initialCustomers: Customer[];
}

export function CustomerList({ initialCustomers }: CustomerListProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (search: string) => {
    setSearchTerm(search);
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await fetch(`/api/customers?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setCustomers(data.customers);
      } else {
        toast.error(data.error || 'Error al buscar clientes');
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      toast.error('Error al buscar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Cliente eliminado correctamente');
        setCustomers(customers.filter((c) => c.id !== id));
      } else {
        toast.error(data.error || 'Error al eliminar el cliente');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Error al eliminar el cliente');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tu base de clientes
          </p>
        </div>
        <Link
          href="/customers/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Cliente
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Total Clientes</div>
          <div className="text-2xl font-bold mt-1">{customers.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Con Reservas</div>
          <div className="text-2xl font-bold mt-1">
            {customers.filter((c) => c._count.bookings > 0).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Total Reservas</div>
          <div className="text-2xl font-bold mt-1">
            {customers.reduce((acc, c) => acc + c._count.bookings, 0)}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email, teléfono o documento..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Cargando clientes...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">
              {searchTerm ? 'No se encontraron clientes' : 'No hay clientes aún'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Teléfono
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Documento
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Reservas
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{customer.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        {customer.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        {customer.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div className="font-medium">{customer.documentType}</div>
                        <div className="text-gray-600">{customer.documentNumber}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {customer._count.bookings}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/customers/${customer.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/customers/${customer.id}/edit`}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Eliminar"
                          disabled={customer._count.bookings > 0}
                        >
                          <Trash2 className="w-4 h-4" />
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
