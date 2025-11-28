
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Car, Calendar, Fuel, Settings, MapPin, Edit, Bike, Ship, Truck, Zap, Waves, Trash2 } from 'lucide-react';
import { formatDate, getStatusColor } from '@/lib/utils';

interface VehicleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete?: (vehicleId: number) => void;
  vehicle: any;
}

export function VehicleDetailsModal({ isOpen, onClose, onEdit, onDelete, vehicle }: VehicleDetailsModalProps) {
  if (!vehicle) return null;

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'rented': return 'Alquilado';
      case 'maintenance': return 'En mantenimiento';
      default: return status || 'Desconocido';
    }
  };

  const getVehicleIcon = (type?: string) => {
    switch (type) {
      case 'car': return <Car className="h-6 w-6 text-blue-600" />;
      case 'motorcycle': return <Bike className="h-6 w-6 text-green-600" />;
      case 'boat': return <Ship className="h-6 w-6 text-blue-500" />;
      case 'buggy': return <Truck className="h-6 w-6 text-orange-600" />;
      case 'jetski': return <Waves className="h-6 w-6 text-teal-600" />;
      case 'electric': return <Zap className="h-6 w-6 text-yellow-600" />;
      default: return <Car className="h-6 w-6 text-gray-600" />;
    }
  };

  const getVehicleTypeName = (type?: string) => {
    switch (type) {
      case 'car': return 'Coche';
      case 'motorcycle': return 'Moto';
      case 'boat': return 'Barco';
      case 'buggy': return 'Buggy';
      case 'jetski': return 'Jet Ski';
      case 'electric': return 'Eléctrico';
      default: return 'Vehículo';
    }
  };

  const handleDelete = () => {
    if (onDelete && confirm(`¿Está seguro de que desea eliminar el vehículo ${vehicle.registration_number}?`)) {
      onDelete(vehicle.id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {getVehicleIcon(vehicle.vehicle_type)}
              {vehicle.registration_number}
              <span className="text-sm font-normal text-gray-500">
                ({getVehicleTypeName(vehicle.vehicle_type)})
              </span>
            </DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              {onDelete && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 hover:bg-red-50 border-red-200"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Información básica */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4">Información del Vehículo</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Marca y Modelo</p>
                  <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Año</p>
                  <p className="font-medium">{vehicle.year}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Color</p>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: vehicle.color?.toLowerCase() }}
                    ></div>
                    <span className="font-medium">{vehicle.color}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo de Vehículo</p>
                  <div className="flex items-center gap-1">
                    {getVehicleIcon(vehicle.vehicle_type)}
                    <span className="font-medium">{getVehicleTypeName(vehicle.vehicle_type)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Combustible</p>
                  <div className="flex items-center gap-1">
                    <Fuel className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{vehicle.fuel_type}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Kilometraje</p>
                  <p className="font-medium">{vehicle.mileage?.toLocaleString()} km</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <Badge className={getStatusColor(vehicle.status)} variant="secondary">
                    {getStatusText(vehicle.status)}
                  </Badge>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-sm text-gray-600">Condición General</p>
                <div className="flex items-center gap-1 mt-1">
                  <Settings className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{vehicle.condition_rating}</span>
                </div>
              </div>
              
              {vehicle.notes && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Notas</p>
                  <p className="mt-1 text-gray-800">{vehicle.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historial simulado */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4">Historial Reciente</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Último mantenimiento completado</p>
                    <p className="text-xs text-gray-600">Cambio de aceite - {formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Última reserva</p>
                    <p className="text-xs text-gray-600">Cliente: Juan Pérez - {formatDate(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000))}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Próximas acciones */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4">Próximas Acciones</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium">Próximo mantenimiento</p>
                      <p className="text-xs text-gray-600">{formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Programar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
