

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  BarChart3, 
  TrendingUp, 
  Car, 
  MapPin, 
  Wrench, 
  Clock,
  PieChart,
  Calendar,
  Download
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface StatisticsData {
  summary: {
    totalBookings: number;
    totalRevenue: number;
    totalMaintenanceRecords: number;
    totalMaintenanceCosts: number;
    avgRentalDuration: number;
  };
  bookingsByGroup: Record<string, { count: number; revenue: number; days: number }>;
  bookingsByModel: Record<string, { count: number; revenue: number; vehicle: any }>;
  bookingsByLocation: Record<string, { count: number; revenue: number; location: string }>;
  maintenanceCostsByVehicle: Record<string, { costs: number; count: number; vehicle: any }>;
  bookingsByHour: Record<number, number>;
}

export default function ReportsPage() {
  const [data, setData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [locationId, setLocationId] = useState('all');
  const [vehicleId, setVehicleId] = useState('all');
  const [locations, setLocations] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  // Load locations and vehicles for filters
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [locationsRes, vehiclesRes] = await Promise.all([
          fetch('/api/locations'),
          fetch('/api/vehicles')
        ]);

        if (locationsRes.ok) {
          const locationsData = await locationsRes.json();
          setLocations(locationsData);
        }

        if (vehiclesRes.ok) {
          const vehiclesData = await vehiclesRes.json();
          setVehicles(vehiclesData);
        }
      } catch (error) {
        console.error('Error loading filters:', error);
      }
    };

    loadFilters();
  }, []);

  // Load statistics
  const loadStatistics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (locationId && locationId !== 'all') params.append('locationId', locationId);
      if (vehicleId && vehicleId !== 'all') params.append('vehicleId', vehicleId);

      const response = await fetch(`/api/reports/statistics?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        toast.error('Error cargando estadísticas');
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
      toast.error('Error cargando estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  const colors = [
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600',
    'from-orange-500 to-orange-600',
    'from-purple-500 to-purple-600',
    'from-pink-500 to-pink-600',
    'from-cyan-500 to-cyan-600',
    'from-yellow-500 to-yellow-600',
    'from-red-500 to-red-600'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estadísticas</h1>
          <p className="text-gray-600">Análisis detallado de la operación</p>
        </div>
        <Button onClick={() => toast.success('Funcionalidad de exportación próximamente')}>
          <Download className="h-4 w-4 mr-2" />
          Exportar Reporte
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label>Fecha Inicio</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Fecha Fin</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Ubicación</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las ubicaciones</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vehículo</Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los vehículos</SelectItem>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                      {vehicle.registration_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={loadStatistics} disabled={loading} className="w-full">
                {loading ? 'Cargando...' : 'Aplicar Filtros'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Reservas</p>
                    <p className="text-2xl font-bold">{data.summary.totalBookings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ingresos Totales</p>
                    <p className="text-2xl font-bold">{formatCurrency(data.summary.totalRevenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Wrench className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Mantenimientos</p>
                    <p className="text-2xl font-bold">{data.summary.totalMaintenanceRecords}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-red-600 transform rotate-180" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Costos Mant.</p>
                    <p className="text-2xl font-bold">{formatCurrency(data.summary.totalMaintenanceCosts)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duración Media</p>
                    <p className="text-2xl font-bold">{data.summary.avgRentalDuration} días</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bookings by Group */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Reservas por Grupo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(data.bookingsByGroup).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No hay datos disponibles</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(data.bookingsByGroup)
                      .sort(([, a], [, b]) => b.count - a.count)
                      .map(([group, stats], index) => {
                        const total = Object.values(data.bookingsByGroup).reduce((sum, s) => sum + s.count, 0);
                        const percentage = ((stats.count / total) * 100).toFixed(1);
                        const colorClass = colors[index % colors.length];

                        return (
                          <div key={group} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{group}</span>
                              <span className="text-gray-600">{stats.count} ({percentage}%)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-3 relative overflow-hidden">
                                <div
                                  className={`bg-gradient-to-r ${colorClass} h-full rounded-full transition-all duration-500`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600">
                              Ingresos: {formatCurrency(stats.revenue)} | Días: {stats.days}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bookings by Model */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Reservas por Modelo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(data.bookingsByModel).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No hay datos disponibles</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(data.bookingsByModel)
                      .sort(([, a], [, b]) => b.count - a.count)
                      .slice(0, 8)
                      .map(([model, stats], index) => {
                        const total = Object.values(data.bookingsByModel).reduce((sum, s) => sum + s.count, 0);
                        const percentage = ((stats.count / total) * 100).toFixed(1);
                        const colorClass = colors[index % colors.length];

                        return (
                          <div key={model} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{model}</span>
                              <span className="text-gray-600">{stats.count} ({percentage}%)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-3 relative overflow-hidden">
                                <div
                                  className={`bg-gradient-to-r ${colorClass} h-full rounded-full transition-all duration-500`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600">
                              Ingresos: {formatCurrency(stats.revenue)}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bookings by Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Reservas por Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(data.bookingsByLocation).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No hay datos disponibles</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(data.bookingsByLocation)
                      .sort(([, a], [, b]) => b.count - a.count)
                      .map(([location, stats], index) => {
                        const total = Object.values(data.bookingsByLocation).reduce((sum, s) => sum + s.count, 0);
                        const percentage = ((stats.count / total) * 100).toFixed(1);
                        const colorClass = colors[index % colors.length];

                        return (
                          <div key={location} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{location}</span>
                              <span className="text-gray-600">{stats.count} ({percentage}%)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-3 relative overflow-hidden">
                                <div
                                  className={`bg-gradient-to-r ${colorClass} h-full rounded-full transition-all duration-500`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600">
                              Ingresos: {formatCurrency(stats.revenue)}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Maintenance Costs by Vehicle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Costos de Mantenimiento por Vehículo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(data.maintenanceCostsByVehicle).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No hay datos disponibles</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(data.maintenanceCostsByVehicle)
                      .sort(([, a], [, b]) => b.costs - a.costs)
                      .slice(0, 8)
                      .map(([registration, stats], index) => {
                        const total = Object.values(data.maintenanceCostsByVehicle).reduce((sum, s) => sum + s.costs, 0);
                        const percentage = total > 0 ? ((stats.costs / total) * 100).toFixed(1) : '0';
                        const colorClass = colors[index % colors.length];

                        return (
                          <div key={registration} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{registration}</span>
                              <span className="text-gray-600">{formatCurrency(stats.costs)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-3 relative overflow-hidden">
                                <div
                                  className={`bg-gradient-to-r ${colorClass} h-full rounded-full transition-all duration-500`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600">
                              {stats.count} mantenimientos
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Peak Hours */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horas Punta de Reservas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(data.bookingsByHour).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No hay datos disponibles</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(data.bookingsByHour)
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([hour, count]) => {
                        const maxCount = Math.max(...Object.values(data.bookingsByHour));
                        const percentage = (count / maxCount) * 100;

                        return (
                          <div key={hour} className="flex items-center gap-4">
                            <span className="text-sm font-medium text-gray-700 w-16">
                              {hour.padStart(2, '0')}:00
                            </span>
                            <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full flex items-center justify-center transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              >
                                {count > 0 && (
                                  <span className="text-sm font-semibold text-white">
                                    {count}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay datos disponibles</p>
        </div>
      )}
    </div>
  );
}
