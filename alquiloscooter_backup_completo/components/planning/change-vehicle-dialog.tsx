
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Car, AlertTriangle, Check, RefreshCw, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Textarea } from '@/components/ui/textarea';

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

interface BookingVehicle {
  id: number;
  car_id: number;
  vehicle_price: number;
  car?: {
    id: number;
    registration_number: string;
    make: string;
    model: string;
    status?: string;
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
  pickup_condition_notes?: string;
  car?: {
    id: number;
    registration_number: string;
    make: string;
    model: string;
  };
  vehicles?: BookingVehicle[];
}

interface ChangeVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: Reservation | null;
  onVehicleChanged: () => void;
}

export function ChangeVehicleDialog({
  open,
  onOpenChange,
  reservation,
  onVehicleChanged
}: ChangeVehicleDialogProps) {
  const [bookingVehicles, setBookingVehicles] = useState<BookingVehicle[]>([]);
  const [selectedCurrentVehicleId, setSelectedCurrentVehicleId] = useState<number | null>(null);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [selectedNewVehicleId, setSelectedNewVehicleId] = useState<string | null>(null);
  const [changeReason, setChangeReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingBookingData, setLoadingBookingData] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [priceRecalculation, setPriceRecalculation] = useState<{
    originalPrice: number;
    newPrice: number;
    difference: number;
    isUpgrade: boolean;
  } | null>(null);

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

  // Cargar datos de la reserva y vehículos disponibles cuando se abre el diálogo
  useEffect(() => {
    if (open && reservation) {
      loadBookingData();
      loadAvailableVehicles();
    } else {
      // Reset cuando se cierra
      setBookingVehicles([]);
      setSelectedCurrentVehicleId(null);
      setSelectedNewVehicleId(null);
      setChangeReason('');
      setPriceRecalculation(null);
    }
  }, [open, reservation]);

  // Calcular diferencia de precio cuando se selecciona un vehículo
  useEffect(() => {
    if (selectedCurrentVehicleId && selectedNewVehicleId) {
      const days = calculateDays();
      const currentVehicle = availableVehicles.find(v => v.id === selectedCurrentVehicleId.toString());
      const newVehicle = availableVehicles.find(v => v.id === selectedNewVehicleId);
      
      if (currentVehicle && newVehicle && currentVehicle.pricingGroup && newVehicle.pricingGroup) {
        const originalPrice = calculatePrice(currentVehicle, days);
        const newPrice = calculatePrice(newVehicle, days);
        const difference = newPrice - originalPrice;
        
        setPriceRecalculation({
          originalPrice,
          newPrice,
          difference,
          isUpgrade: difference > 0
        });
      }
    } else {
      setPriceRecalculation(null);
    }
  }, [selectedCurrentVehicleId, selectedNewVehicleId, availableVehicles]);

  const loadBookingData = async () => {
    if (!reservation) return;

    try {
      setLoadingBookingData(true);

      // Obtener los datos completos de la reserva con todos sus vehículos
      const bookingRes = await fetch(`/api/bookings/${reservation.id}`);
      if (!bookingRes.ok) {
        toast.error('Error cargando datos de la reserva');
        return;
      }

      const bookingData = await bookingRes.json();
      
      // Si tiene vehículos múltiples, usar esos; si no, usar el car_id principal
      if (bookingData.vehicles && bookingData.vehicles.length > 0) {
        setBookingVehicles(bookingData.vehicles);
      } else if (bookingData.car) {
        // Reserva simple con un solo vehículo
        setBookingVehicles([{
          id: 0,
          car_id: bookingData.car.id,
          vehicle_price: bookingData.total_price || 0,
          car: bookingData.car
        }]);
      }

    } catch (error) {
      console.error('Error loading booking data:', error);
      toast.error('Error cargando datos de la reserva');
    } finally {
      setLoadingBookingData(false);
    }
  };

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
      
      // IDs de vehículos reservados (excluyendo todos los vehículos de la reserva actual)
      const reservedCarIds = new Set<string>();
      
      bookings.forEach((b: any) => {
        if (b.id !== reservation.id) {
          // Añadir car_id principal si existe
          if (b.car_id) {
            reservedCarIds.add(b.car_id.toString());
          }
          // Añadir vehículos múltiples si existen
          if (b.vehicles && Array.isArray(b.vehicles)) {
            b.vehicles.forEach((v: any) => {
              if (v.car_id) {
                reservedCarIds.add(v.car_id.toString());
              }
            });
          }
        }
      });

      // Filtrar vehículos disponibles (activos y no reservados en esas fechas)
      const available = allVehicles.filter((v: Vehicle) => 
        v.status === 'T' && !reservedCarIds.has(v.id)
      );

      setAvailableVehicles(available);

      if (available.length === 0) {
        toast.error('No hay otros vehículos disponibles en esas fechas', { duration: 4000 });
      }
    } catch (error) {
      console.error('Error loading available vehicles:', error);
      toast.error('Error cargando vehículos disponibles');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleChangeVehicle = async () => {
    if (!reservation) {
      toast.error('Reserva no válida');
      return;
    }

    if (!selectedCurrentVehicleId) {
      toast.error('Selecciona el vehículo actual que quieres cambiar');
      return;
    }

    if (!selectedNewVehicleId) {
      toast.error('Selecciona el nuevo vehículo');
      return;
    }

    if (!changeReason.trim()) {
      toast.error('Indica el motivo del cambio');
      return;
    }

    try {
      setLoading(true);

      const currentVehicle = bookingVehicles.find(v => v.car_id === selectedCurrentVehicleId);
      if (!currentVehicle) {
        toast.error('Vehículo actual no encontrado');
        return;
      }

      // Si la reserva tiene múltiples vehículos, actualizar en BookingVehicles
      if (bookingVehicles.length > 1 || (bookingVehicles.length === 1 && bookingVehicles[0].id > 0)) {
        // Actualizar el vehículo en BookingVehicles
        const response = await fetch(`/api/bookings/${reservation.id}/vehicles/${currentVehicle.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            car_id: parseInt(selectedNewVehicleId),
            change_reason: changeReason
          })
        });

        if (!response.ok) {
          const error = await response.json();
          toast.error(error.message || 'Error cambiando vehículo');
          return;
        }
      } else {
        // Reserva simple: actualizar car_id principal
        const originalVehicleInfo = currentVehicle.car?.registration_number || `ID: ${currentVehicle.car_id}`;
        const response = await fetch(`/api/bookings/${reservation.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            car_id: parseInt(selectedNewVehicleId),
            // Agregar nota sobre el cambio
            pickup_condition_notes: `[CAMBIO DE VEHÍCULO] ${changeReason}\n\nVehículo original: ${originalVehicleInfo}\n${reservation.pickup_condition_notes || ''}`
          })
        });

        if (!response.ok) {
          const error = await response.json();
          toast.error(error.message || 'Error cambiando vehículo');
          return;
        }
      }

      toast.success('Vehículo cambiado exitosamente');
      
      // Regenerar contrato si existe (incluso si está firmado)
      try {
        const contractResponse = await fetch(`/api/contracts/${reservation.id}/regenerate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            changeReason: `Cambio de vehículo: ${changeReason}`
          })
        });

        if (contractResponse.ok) {
          console.log('Contrato regenerado con el cambio de vehículo');
        } else {
          console.warn('No se pudo regenerar el contrato (puede no existir aún)');
        }
      } catch (contractError) {
        console.error('Error regenerando contrato:', contractError);
        // No bloqueamos el flujo si falla la regeneración del contrato
      }
      
      onVehicleChanged();
      onOpenChange(false);
    } catch (error) {
      console.error('Error changing vehicle:', error);
      toast.error('Error cambiando vehículo');
    } finally {
      setLoading(false);
    }
  };

  if (!reservation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <span>Cambiar Vehículo de Reserva</span>
          </DialogTitle>
          <DialogDescription>
            {bookingVehicles.length > 1 
              ? 'Esta reserva tiene múltiples vehículos. Selecciona cuál quieres cambiar y por cuál.'
              : 'Reasigna un nuevo vehículo a esta reserva (por avería, upgrade, o cambio de prioridad)'}
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

          {/* PASO 1: Selección de vehículo actual a cambiar */}
          <div>
            <Label className="text-sm font-semibold mb-2 block flex items-center gap-2">
              <Badge className="bg-blue-600">1</Badge>
              Selecciona el vehículo que quieres cambiar
              {loadingBookingData && <RefreshCw className="h-4 w-4 animate-spin ml-2" />}
            </Label>
            
            {loadingBookingData ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Cargando vehículos de la reserva...</span>
              </div>
            ) : bookingVehicles.length === 0 ? (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm text-yellow-800">
                    No se pudieron cargar los vehículos de la reserva
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {bookingVehicles.map((vehicle) => {
                  const isSelected = selectedCurrentVehicleId === vehicle.car_id;
                  
                  return (
                    <Card 
                      key={vehicle.car_id}
                      className={`cursor-pointer hover:shadow-md transition-shadow ${
                        isSelected ? 'border-blue-500 border-2 bg-blue-50' : 'border-gray-300'
                      }`}
                      onClick={() => setSelectedCurrentVehicleId(vehicle.car_id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Car className={`h-6 w-6 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                            <div>
                              <div className="font-semibold">{vehicle.car?.registration_number || `ID: ${vehicle.car_id}`}</div>
                              <div className="text-sm text-gray-600">
                                {vehicle.car ? `${vehicle.car.make} ${vehicle.car.model}` : 'Información no disponible'}
                              </div>
                            </div>
                          </div>
                          {isSelected && <Check className="h-6 w-6 text-blue-600" />}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* PASO 2: Selección de nuevo vehículo */}
          {selectedCurrentVehicleId && (
            <>
              <div className="flex items-center justify-center py-2">
                <ArrowRight className="h-6 w-6 text-gray-400" />
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2 block flex items-center gap-2">
                  <Badge className="bg-green-600">2</Badge>
                  Selecciona el nuevo vehículo
                  {checkingAvailability && <RefreshCw className="h-4 w-4 animate-spin ml-2" />}
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
                        No hay otros vehículos disponibles en estas fechas
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableVehicles.map((vehicle) => {
                      // No mostrar los vehículos que ya están en la reserva
                      const isInBooking = bookingVehicles.some(bv => bv.car_id.toString() === vehicle.id);
                      const isSelected = selectedNewVehicleId === vehicle.id;
                      
                      if (isInBooking) return null;

                      return (
                        <Card 
                          key={vehicle.id}
                          className={`cursor-pointer hover:shadow-md transition-shadow ${
                            isSelected ? 'border-green-500 border-2 bg-green-50' : ''
                          }`}
                          onClick={() => setSelectedNewVehicleId(vehicle.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Car className={`h-6 w-6 ${isSelected ? 'text-green-600' : 'text-gray-600'}`} />
                                <div>
                                  <div className="font-semibold">{vehicle.registration_number}</div>
                                  <div className="text-sm text-gray-600">
                                    {vehicle.make} {vehicle.model}
                                  </div>
                                </div>
                              </div>
                              {isSelected && <Check className="h-6 w-6 text-green-600" />}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Recálculo de precio (si hay upgrade/downgrade) */}
          {priceRecalculation && (
            <Card className={priceRecalculation.isUpgrade ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'}>
              <CardContent className="p-4 space-y-3">
                <div className="font-semibold text-gray-900 flex items-center gap-2">
                  {priceRecalculation.isUpgrade ? (
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  ) : (
                    <Check className="h-5 w-5 text-green-600" />
                  )}
                  {priceRecalculation.isUpgrade ? 'Upgrade Detectado' : 'Precio Reducido'}
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Precio Original</p>
                    <p className="font-bold text-lg">{priceRecalculation.originalPrice.toFixed(2)} €</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Precio Nuevo</p>
                    <p className="font-bold text-lg">{priceRecalculation.newPrice.toFixed(2)} €</p>
                  </div>
                  <div>
                    <p className="text-gray-600">{priceRecalculation.isUpgrade ? 'A COBRAR' : 'A DEVOLVER'}</p>
                    <p className={`font-bold text-xl ${priceRecalculation.isUpgrade ? 'text-orange-600' : 'text-green-600'}`}>
                      {priceRecalculation.isUpgrade ? '+' : ''}{priceRecalculation.difference.toFixed(2)} €
                    </p>
                  </div>
                </div>
                
                {priceRecalculation.isUpgrade && (
                  <p className="text-xs text-orange-700 pt-2 border-t border-orange-200">
                    <strong>Importante:</strong> El cliente debe pagar la diferencia de {priceRecalculation.difference.toFixed(2)} € por el upgrade.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Motivo del cambio */}
          {selectedCurrentVehicleId && selectedNewVehicleId && (
            <div>
              <Label htmlFor="change_reason" className="text-sm font-semibold mb-2 block flex items-center gap-2">
                <Badge className="bg-orange-600">3</Badge>
                Motivo del Cambio *
              </Label>
              <Textarea
                id="change_reason"
                placeholder="Ej: Avería del vehículo original, Upgrade solicitado por el cliente, Reasignación por prioridad de pago..."
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Este motivo quedará registrado en las notas de la reserva
              </p>
            </div>
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
            onClick={handleChangeVehicle}
            disabled={loading || !selectedCurrentVehicleId || !selectedNewVehicleId || !changeReason.trim() || availableVehicles.length === 0}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {loading ? 'Cambiando...' : 'Confirmar Cambio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
