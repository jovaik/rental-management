
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Eye,
  AlertCircle,
  Plus,
  Receipt
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface VehicleStats {
  totalReservas: number;
  reservasActivas: number;
  ingresosTotales: string;
  comisionPorcentaje: number;
  comisionTotal: string;
  totalGastos: string;
  balance: string;
}

interface Vehicle {
  id: number;
  registration_number: string;
  make: string;
  model: string;
  year: number;
  color: string;
  commission_percentage: any;
  ownership_type: string;
  estadisticas: VehicleStats;
  pricingGroup: {
    name: string;
    price_per_day: any;
  } | null;
}

export default function MisVehiculosPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [vehiculos, setVehiculos] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    // Verificar que es propietario
    if (session.user?.role !== 'propietario' && session.user?.role !== 'super_admin') {
      toast.error('No tienes acceso a esta página');
      router.push('/');
      return;
    }

    fetchVehiculos();
  }, [session, status, router]);

  const fetchVehiculos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/propietarios/vehiculos');
      const data = await response.json();

      if (data.success) {
        setVehiculos(data.vehiculos);
      } else {
        toast.error('Error al cargar vehículos');
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Error al cargar vehículos');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(num);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Calcular totales generales
  const totalesGenerales = vehiculos.reduce((acc, v) => {
    return {
      totalVehiculos: acc.totalVehiculos + 1,
      totalReservas: acc.totalReservas + v.estadisticas.totalReservas,
      reservasActivas: acc.reservasActivas + v.estadisticas.reservasActivas,
      comisionTotal: acc.comisionTotal + parseFloat(v.estadisticas.comisionTotal),
      totalGastos: acc.totalGastos + parseFloat(v.estadisticas.totalGastos),
      balance: acc.balance + parseFloat(v.estadisticas.balance)
    };
  }, {
    totalVehiculos: 0,
    totalReservas: 0,
    reservasActivas: 0,
    comisionTotal: 0,
    totalGastos: 0,
    balance: 0
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Vehículos</h1>
            <p className="text-gray-600 mt-1">
              Panel de gestión de vehículos en cesión
            </p>
          </div>
        </div>

        {/* Resumen General */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Car className="h-4 w-4" />
                Vehículos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalesGenerales.totalVehiculos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Reservas Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalesGenerales.totalReservas}</div>
              <p className="text-xs text-gray-500 mt-1">
                {totalesGenerales.reservasActivas} activas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Comisiones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalesGenerales.comisionTotal)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Gastos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalesGenerales.totalGastos)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalesGenerales.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalesGenerales.balance)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Vehículos */}
        {vehiculos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay vehículos asignados
              </h3>
              <p className="text-gray-600 text-center">
                Actualmente no tienes vehículos en cesión. Contacta con el administrador.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {vehiculos.map((vehiculo) => (
              <Card key={vehiculo.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold">
                        {vehiculo.make} {vehiculo.model}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <span className="font-medium text-gray-900">
                          {vehiculo.registration_number}
                        </span>
                        {' • '}
                        {vehiculo.year} • {vehiculo.color}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {vehiculo.estadisticas.comisionPorcentaje}% comisión
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {/* Estadísticas */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Reservas</p>
                        <p className="text-lg font-bold text-blue-600">
                          {vehiculo.estadisticas.totalReservas}
                        </p>
                        <p className="text-xs text-gray-500">
                          {vehiculo.estadisticas.reservasActivas} activas
                        </p>
                      </div>

                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Tu Comisión</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(vehiculo.estadisticas.comisionTotal)}
                        </p>
                        <p className="text-xs text-gray-500">
                          de {formatCurrency(vehiculo.estadisticas.ingresosTotales)}
                        </p>
                      </div>

                      <div className="bg-red-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Gastos</p>
                        <p className="text-lg font-bold text-red-600">
                          {formatCurrency(vehiculo.estadisticas.totalGastos)}
                        </p>
                      </div>

                      <div className={`p-3 rounded-lg ${parseFloat(vehiculo.estadisticas.balance) >= 0 ? 'bg-emerald-50' : 'bg-orange-50'}`}>
                        <p className="text-xs text-gray-600 mb-1">Balance</p>
                        <p className={`text-lg font-bold ${parseFloat(vehiculo.estadisticas.balance) >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                          {formatCurrency(vehiculo.estadisticas.balance)}
                        </p>
                      </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => router.push(`/mis-vehiculos/${vehiculo.id}`)}
                        className="flex-1 bg-orange-500 hover:bg-orange-600"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </Button>
                      <Button
                        onClick={() => router.push(`/mis-vehiculos/${vehiculo.id}?tab=gastos`)}
                        variant="outline"
                        className="flex-1"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Añadir Gasto
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
