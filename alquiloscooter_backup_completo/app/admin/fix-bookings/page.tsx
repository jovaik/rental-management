
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Check, Car, Calendar, User, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Booking {
  id: number;
  car_id: number | null;
  customer_name: string | null;
  pickup_date: string;
  return_date: string;
  status: string | null;
}

interface Vehicle {
  id: number;
  registration_number: string;
  make: string;
  model: string;
  status: string;
}

export default function FixBookingsPage() {
  const [bookingsWithoutVehicle, setBookingsWithoutVehicle] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [assignments, setAssignments] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar reservas
      const bookingsRes = await fetch('/api/bookings');
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        const withoutVehicle = bookingsData.filter((b: Booking) => b.car_id === null);
        setBookingsWithoutVehicle(withoutVehicle);
      }

      // Cargar vehículos activos
      const vehiclesRes = await fetch('/api/vehicles');
      if (vehiclesRes.ok) {
        const vehiclesData = await vehiclesRes.json();
        const activeVehicles = vehiclesData.filter((v: Vehicle) => v.status === 'T');
        setVehicles(activeVehicles);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleAssignment = (bookingId: number, vehicleId: string) => {
    setAssignments(prev => ({
      ...prev,
      [bookingId]: parseInt(vehicleId)
    }));
  };

  const handleSaveAll = async () => {
    const assignmentCount = Object.keys(assignments).length;
    if (assignmentCount === 0) {
      toast.error('No hay asignaciones para guardar');
      return;
    }

    try {
      setSaving(true);
      
      let successCount = 0;
      let errorCount = 0;

      // Actualizar cada reserva
      for (const [bookingId, vehicleId] of Object.entries(assignments)) {
        try {
          const response = await fetch(`/api/bookings/${bookingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              car_id: vehicleId
            })
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Error updating booking ${bookingId}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`✅ ${successCount} reservas actualizadas correctamente`);
      }
      
      if (errorCount > 0) {
        toast.error(`❌ ${errorCount} reservas fallaron`);
      }

      // Recargar datos
      await loadData();
      setAssignments({});
      
    } catch (error) {
      console.error('Error saving assignments:', error);
      toast.error('Error guardando asignaciones');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Corregir Reservas sin Vehículo
        </h1>
        <p className="text-gray-600">
          Asigna vehículos a las reservas que no tienen uno asignado
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Reservas sin Vehículo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <span className="text-3xl font-bold text-gray-900">
                {bookingsWithoutVehicle.length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Vehículos Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Car className="h-8 w-8 text-blue-500" />
              <span className="text-3xl font-bold text-gray-900">
                {vehicles.length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Asignaciones Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Check className="h-8 w-8 text-green-500" />
              <span className="text-3xl font-bold text-gray-900">
                {Object.keys(assignments).length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de reservas */}
      {bookingsWithoutVehicle.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              ¡Todas las reservas tienen vehículo asignado!
            </h3>
            <p className="text-gray-600">
              No hay reservas que requieran corrección
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Reservas que Requieren Asignación</span>
              </CardTitle>
              <CardDescription>
                Selecciona un vehículo para cada reserva y guarda los cambios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {bookingsWithoutVehicle.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 gap-4"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="font-mono">
                        ID: {booking.id}
                      </Badge>
                      <Badge className={
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {booking.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{booking.customer_name || 'Sin nombre'}</span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(booking.pickup_date)}</span>
                      </div>
                      <span>→</span>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(booking.return_date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-64">
                    <Select
                      value={assignments[booking.id]?.toString() || ''}
                      onValueChange={(value) => handleVehicleAssignment(booking.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar vehículo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                            <div className="flex items-center space-x-2">
                              <Car className="h-4 w-4" />
                              <span>{vehicle.registration_number} - {vehicle.make} {vehicle.model}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={loadData}
              disabled={saving}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
              Recargar
            </Button>
            <Button
              onClick={handleSaveAll}
              disabled={Object.keys(assignments).length === 0 || saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Guardar Asignaciones ({Object.keys(assignments).length})
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
