
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';
import { Search, Plus, Phone, Mail, Calendar, Car, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface ApiCustomer {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  dni_nie: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  dni_nie: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export default function ClientesPage() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/customers');
        if (response?.ok) {
          const data: ApiCustomer[] = await response.json();
          
          // Transformar los datos de la API al formato esperado
          const transformedCustomers: Customer[] = data.map(customer => ({
            id: customer.id,
            name: `${customer.first_name} ${customer.last_name}`,
            email: customer.email || 'Sin email',
            phone: customer.phone || 'Sin teléfono',
            dni_nie: customer.dni_nie || 'Sin documento',
            status: customer.status === 'active' ? 'active' : 'inactive',
            created_at: customer.created_at
          }));
          
          setCustomers(transformedCustomers);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    const name = (customer.name || '').toLowerCase();
    const email = (customer.email || '').toLowerCase();
    const phone = (customer.phone || '');
    const dni = (customer.dni_nie || '').toLowerCase();
    
    return name.includes(searchLower) ||
           email.includes(searchLower) ||
           phone.includes(searchTerm) ||
           dni.includes(searchLower);
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Clientes</h1>
          <p className="text-gray-600">
            Administra la información de tus clientes y gestiona su documentación
          </p>
        </div>
        <Button onClick={() => router.push('/customers')}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Barra de búsqueda */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{customer.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {customer.dni_nie}
                  </CardDescription>
                </div>
                <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                  {customer.status === 'active' ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{customer.email}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>{customer.phone}</span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Desde {format(new Date(customer.created_at), 'dd/MM/yyyy')}</span>
                </div>

                <div className="pt-3 space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => router.push(`/clientes/${customer.id}`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Ver / Editar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="w-12 h-12 mx-auto mb-4" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
          </h3>
          <p className="text-gray-500">
            {searchTerm 
              ? 'Intenta con términos de búsqueda diferentes'
              : 'Comienza agregando tu primer cliente'
            }
          </p>
        </div>
      )}
    </div>
  );
}
