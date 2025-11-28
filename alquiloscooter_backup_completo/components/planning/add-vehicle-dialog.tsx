
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Car, AlertTriangle, Check, RefreshCw, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Vehicle {
  id: string;
  registration_number: string;
  make: string;
  model: string;
  status: 'T' | 'F';
  pricing_group_id?: number;
  pricingGroup?: {
    id: number;
    name: string;
    price_1_3_days: number;
    price_4_7_days: number;
    price_8_plus_days: number;
  };
}

interface Reservation {
  id: number;
  car_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  pickup_date: string;
  return_date: string;
  status: string;
  total_price: number;
  vehicles?: Array<{
    id: number;
    car_id: number;
    vehicle_price: number;
    car: {
      id: number;
      registration_number: string;
      make: string;
      model: string;
    };
  }>;
}

interface AddVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: Reservation | null;
  onVehicleAdded: () => void;
}

export function AddVehicleDialog({
  open,
  onOpenChange,
  reservation,
  onVehicleAdded
}: AddVehicleDialogProps) {
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Función para calcular el precio según el pricing group y días
  const calculatePrice = (vehicle: Vehicle, days: number): number => {
    if (!vehicle.pricingGroup) return 0;
    
    const pg = vehicle.pricingGroup;
    if (days <= 3) {
      return Number(pg.price_1_3_days) * days;
    } else if (days <= 7) {
      return Number(pg.price_4_7_days) * days;
    } else {
      return Number(pg.price_8_plus_days) * days;
    }
  };

  // Función para calcular el número de días
  const calculateDays = () => {
    if (!reservation) return 0;
    const pickup = new Date(reservation.pickup_date);
    const returnDate = new Date(reservation.return_date);
    const diff = returnDate.getTime() - pickup.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // Cargar vehículos disponibles cuando se abre el diálogo
  useEffect(() => {
    if (open && reservation) {
      loadAvailableVehicles();
    } else {
      // Reset cuando se cierra
      setSelectedVehicleIds([]);
    }
  }, [open, reservation]);

  const loadAvailableVehicles = async () => {
    if (!reservation) return;

    try {
      setCheckingAvailability(true);

      // Obtener todos los vehículos con sus pricing groups
      const vehiclesRes = await fetch('/api/vehicles?include=pricingGroup');
      if (!vehiclesRes.ok) {
        toast.error('Error cargando vehículos');
        return;
      }
      const allVehicles = await vehiclesRes.json();

      // Obtener reservas en el mismo período (excluyendo la actual)
      const bookingsRes = await fetch(
        `/api/bookings?start=${reservation.pickup_date}&end=${reservation.return_date}`
      );
      
      if (!bookingsRes.ok) {
        toast.error('Error verificando disponibilidad');
        return;
      }

      const bookings = await bookingsRes.json();
      
      // IDs de vehículos ya reservados en ese período
      const reservedCarIds = new Set<string>();
      bookings.forEach((booking: any) => {
        if (booking.vehicles && booking.vehicles.length > 0) {
          booking.vehicles.forEach((v: any) => {
            reservedCarIds.add(v.car_id?.toString());
          });
        } else if (booking.car_id) {
          reservedCarIds.add(booking.car_id.toString());
        }
      });

      // IDs de vehículos ya en esta reserva
      const currentVehicleIds = new Set<string>();
      if (reservation.vehicles && reservation.vehicles.length > 0) {
        reservation.vehicles.forEach(v => {
          currentVehicleIds.add(v.car_id.toString());
        });
      } else {
        currentVehicleIds.add(reservation.car_id.toString());
      }

      // Filtrar vehículos disponibles (activos, con pricing group, no reservados y no ya en esta reserva)
      const available = allVehicles.filter((v: Vehicle) => 
        v.status === 'T' && 
        v.pricingGroup &&
        !reservedCarIds.has(v.id) &&
        !currentVehicleIds.has(v.id)
      );

      setAvailableVehicles(available);

      if (available.length === 0) {
        toast.error('No hay más vehículos disponibles en esas fechas', { duration: 4000 });
      }
    } catch (error) {
      console.error('Error loading available vehicles:', error);
      toast.error('Error cargando vehículos disponibles');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const toggleVehicleSelection = (vehicleId: string) => {
    setSelectedVehicleIds(prev => 
      prev.includes(vehicleId)
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const handleAddVehicles = async () => {
    if (!reservation || selectedVehicleIds.length === 0) {
      toast.error('Selecciona al menos un vehículo');
      return;
    }

    try {
      setLoading(true);

      const days = calculateDays();

      // Preparar la lista de vehículos a añadir con sus precios
      const vehiclesToAdd = selectedVehicleIds.map(vehicleId => {
        const vehicle = availableVehicles.find(v => v.id === vehicleId);
        if (!vehicle) return null;
        
        const price = calculatePrice(vehicle, days);
        return {
          car_id: parseInt(vehicleId),
          vehicle_price: price
        };
      }).filter(Boolean);

      // Llamar al endpoint para añadir vehículos
      const response = await fetch(`/api/bookings/${reservation.id}/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          vehicles: vehiclesToAdd,
          applyExtrasUpgrades: true // Flag para aplicar extras/upgrades
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Mostrar resumen de lo que se añadió
        if (result.extrasApplied || result.upgradesApplied) {
          toast.success(
            `✅ ${selectedVehicleIds.length} vehículo(s) añadido(s)\n` +
            `${result.extrasApplied ? '✅ Extras aplicados' : ''}\n` +
            `${result.upgradesApplied ? '✅ Upgrades aplicados' : ''}`,
            { duration: 5000 }
          );
        } else {
          toast.success(`${selectedVehicleIds.length} vehículo(s) añadido(s) exitosamente`);
        }
        
        // Regenerar contrato si existe
        try {
          await fetch(`/api/contracts/${reservation.id}/regenerate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              changeReason: `Añadidos ${selectedVehicleIds.length} vehículo(s) adicional(es) a la reserva`
            })
          });
        } catch (contractError) {
          console.error('Error regenerando contrato:', contractError);
        }
        
        onVehicleAdded();
        onOpenChange(false);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error añadiendo vehículos');
      }
    } catch (error) {
      console.error('Error adding vehicles:', error);
      toast.error('Error añadiendo vehículos');
    } finally {
      setLoading(false);
    }
  };

  if (!reservation) return null;

  const totalSelectedPrice = selectedVehicleIds.reduce((sum, vehicleId) => {
    const vehicle = availableVehicles.find(v => v.id === vehicleId);
    if (!vehicle) return sum;
    return sum + calculatePrice(vehicle, calculateDays());
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-blue-600" />
            <span>Añadir Vehículos Adicionales</span>
          </DialogTitle>
          <DialogDescription>
            Añade uno o más vehículos adicionales a esta reserva
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información de la reserva */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 space-y-2">
              <div className="font-semibold text-blue-900">Información de la Reserva</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Cliente:</span>
                  <div className="font-medium">{reservation.customer_name}</div>
                </div>
                <div>
                  <span className="text-gray-600">Teléfono:</span>
                  <div className="font-medium">{reservation.customer_phone || 'Sin teléfono'}</div>
                </div>
                <div>
                  <span className="text-gray-600">Recogida:</span>
                  <div className="font-medium">
                    {new Date(reservation.pickup_date).toLocaleDateString('es-ES')}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Devolución:</span>
                  <div className="font-medium">
                    {new Date(reservation.return_date).toLocaleDateString('es-ES')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehículos actuales */}
          {reservation.vehicles && reservation.vehicles.length > 0 && (
            <div>
              <Label className="text-sm font-semibold mb-2 block">Vehículos Actuales</Label>
              <div className="space-y-2">
                {reservation.vehicles.map((vehicle, idx) => (
                  <Card key={vehicle.id} className="border-gray-300">
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-3">
                        <Car className="h-5 w-5 text-gray-600" />
                        <div className="flex-1">
                          <div className="font-semibold">
                            {idx + 1}. {vehicle.car.registration_number}
                          </div>
                          <div className="text-sm text-gray-600">
                            {vehicle.car.make} {vehicle.car.model}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">€{Number(vehicle.vehicle_price).toFixed(2)}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Selección de vehículos disponibles */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">
              Vehículos Disponibles {checkingAvailability && '(Cargando...)'}
            </Label>
            
            {checkingAvailability ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Verificando disponibilidad...</span>
              </div>
            ) : availableVehicles.length === 0 ? (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm text-yellow-800">
                    No hay más vehículos disponibles en estas fechas
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableVehicles.map((vehicle) => {
                  const isSelected = selectedVehicleIds.includes(vehicle.id);
                  const price = calculatePrice(vehicle, calculateDays());
                  
                  return (
                    <Card 
                      key={vehicle.id}
                      className={`cursor-pointer hover:shadow-md transition-shadow ${
                        isSelected ? 'border-blue-500 border-2 bg-blue-50' : ''
                      }`}
                      onClick={() => toggleVehicleSelection(vehicle.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <Car className={`h-6 w-6 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                            <div>
                              <div className="font-semibold">{vehicle.registration_number}</div>
                              <div className="text-sm text-gray-600">
                                {vehicle.make} {vehicle.model}
                              </div>
                              {vehicle.pricingGroup && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {vehicle.pricingGroup.name}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-sm font-semibold text-blue-600">
                                €{price.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {calculateDays()} día(s)
                              </div>
                            </div>
                            {isSelected && <Check className="h-6 w-6 text-blue-600" />}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resumen de precio */}
          {selectedVehicleIds.length > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Vehículos seleccionados</p>
                    <p className="font-semibold text-lg">{selectedVehicleIds.length}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Coste adicional total</p>
                    <p className="font-bold text-xl text-green-600">
                      +€{totalSelectedPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2 pt-2 border-t border-green-200">
                  Este importe se sumará al precio total de la reserva
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleAddVehicles}
            disabled={loading || selectedVehicleIds.length === 0 || availableVehicles.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Añadiendo...' : `Añadir ${selectedVehicleIds.length} Vehículo(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
