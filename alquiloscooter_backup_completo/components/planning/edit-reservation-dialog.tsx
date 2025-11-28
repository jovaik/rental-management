
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Users, Upload, X, FileText, Calendar, User, Car } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AddDriverDialog } from './add-driver-dialog';
import { DriverDocumentsDialog } from './driver-documents-dialog';

interface Driver {
  id: number;
  full_name: string;
  dni_nie: string;
  driver_license: string;
  license_expiry?: string;
  phone?: string;
  email?: string;
  driver_license_front?: string;
  driver_license_back?: string;
  id_document_front?: string;
  id_document_back?: string;
}

interface Reservation {
  id: number;
  booking_number?: string;
  customer_id: number | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  pickup_date: string;
  return_date: string;
  status: string;
  total_price: number;
  car?: {
    id: number;
    registration_number: string;
    make: string;
    model: string;
  };
  vehicles?: Array<{
    id: number;
    car_id: number;
    car?: {
      id: number;
      registration_number: string;
      make: string;
      model: string;
    };
  }>;
  drivers?: Driver[];
}

interface EditReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: Reservation | null;
  onReservationUpdated: () => void;
}

export function EditReservationDialog({
  open,
  onOpenChange,
  reservation,
  onReservationUpdated
}: EditReservationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [showAddDriverDialog, setShowAddDriverDialog] = useState(false);
  const [showDriverDocumentsDialog, setShowDriverDocumentsDialog] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [reservationData, setReservationData] = useState<Reservation | null>(null);

  // Cargar datos completos de la reserva cuando se abre el diálogo
  useEffect(() => {
    if (open && reservation) {
      loadReservationDetails();
    }
  }, [open, reservation]);

  const loadReservationDetails = async () => {
    if (!reservation) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/bookings/${reservation.id}`);
      if (response.ok) {
        const data = await response.json();
        setReservationData(data);
      } else {
        toast.error('Error cargando detalles de la reserva');
      }
    } catch (error) {
      console.error('Error loading reservation details:', error);
      toast.error('Error cargando detalles de la reserva');
    } finally {
      setLoading(false);
    }
  };

  const handleDriverAdded = () => {
    loadReservationDetails();
    onReservationUpdated();
  };

  const handleRemoveDriver = async (driverId: number) => {
    if (!reservationData) return;
    
    if (!confirm('¿Está seguro de que desea eliminar este conductor adicional?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/bookings/${reservationData.id}/drivers/${driverId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast.success('Conductor eliminado exitosamente');
        
        // Regenerar contrato
        try {
          await fetch(`/api/contracts/${reservationData.id}/regenerate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              changeReason: 'Conductor adicional eliminado de la reserva'
            })
          });
        } catch (contractError) {
          console.error('Error regenerando contrato:', contractError);
        }
        
        loadReservationDetails();
        onReservationUpdated();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error eliminando conductor');
      }
    } catch (error) {
      console.error('Error removing driver:', error);
      toast.error('Error eliminando conductor');
    }
  };

  const handleManageDocuments = (driver: Driver) => {
    setSelectedDriver(driver);
    setShowDriverDocumentsDialog(true);
  };

  if (!reservationData) {
    return null;
  }

  // Obtener todos los vehículos de la reserva
  const allVehicles = reservationData.vehicles && reservationData.vehicles.length > 0
    ? reservationData.vehicles.map(v => v.car).filter(Boolean)
    : reservationData.car ? [reservationData.car] : [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span>Editar Reserva - {reservationData.booking_number || `#${reservationData.id}`}</span>
            </DialogTitle>
            <DialogDescription>
              Gestiona los detalles de la reserva, conductores y documentación
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">
                <FileText className="h-4 w-4 mr-2" />
                Información
              </TabsTrigger>
              <TabsTrigger value="vehicles">
                <Car className="h-4 w-4 mr-2" />
                Vehículos
              </TabsTrigger>
              <TabsTrigger value="drivers">
                <Users className="h-4 w-4 mr-2" />
                Conductores
              </TabsTrigger>
            </TabsList>

            {/* Tab: Información general */}
            <TabsContent value="info" className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">Cliente</Label>
                      <div className="font-medium">{reservationData.customer_name}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Teléfono</Label>
                      <div className="font-medium">{reservationData.customer_phone || 'Sin teléfono'}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Email</Label>
                      <div className="font-medium text-sm">{reservationData.customer_email || 'Sin email'}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Estado</Label>
                      <div>
                        <Badge variant={
                          reservationData.status === 'completed' ? 'default' :
                          reservationData.status === 'confirmed' ? 'secondary' :
                          reservationData.status === 'pending' ? 'outline' :
                          'destructive'
                        }>
                          {reservationData.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Fecha Recogida</Label>
                      <div className="font-medium">
                        {new Date(reservationData.pickup_date).toLocaleDateString('es-ES', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Fecha Devolución</Label>
                      <div className="font-medium">
                        {new Date(reservationData.return_date).toLocaleDateString('es-ES', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Vehículos */}
            <TabsContent value="vehicles" className="space-y-4">
              <div className="space-y-2">
                {allVehicles.length === 0 ? (
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="p-4 text-center">
                      <Car className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                      <p className="text-sm text-yellow-800">
                        No hay vehículos asignados a esta reserva
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  allVehicles.map((vehicle: any, index: number) => (
                    <Card key={vehicle?.id || index} className="border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Car className="h-6 w-6 text-blue-600" />
                          <div className="flex-1">
                            <div className="font-semibold">
                              {vehicle?.registration_number || 'Sin matrícula'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {vehicle?.make || ''} {vehicle?.model || ''}
                            </div>
                          </div>
                          {allVehicles.length > 1 && (
                            <Badge variant="outline">Vehículo {index + 1}</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Tab: Conductores */}
            <TabsContent value="drivers" className="space-y-4">
              {/* Botón para añadir conductores */}
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowAddDriverDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Añadir Conductor
                </Button>
              </div>

              {/* Conductor titular */}
              <Card className="border-green-300 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <User className="h-6 w-6 text-green-600 mt-1" />
                      <div className="flex-1">
                        <div className="font-semibold">{reservationData.customer_name}</div>
                        <div className="text-sm text-green-700 mt-1">
                          Cliente titular (Conductor principal)
                        </div>
                        {reservationData.customer_phone && (
                          <div className="text-xs text-gray-600 mt-1">
                            {reservationData.customer_phone}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-600">Principal</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Conductores adicionales */}
              {reservationData.drivers && reservationData.drivers.length > 0 ? (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Conductores Adicionales Autorizados</Label>
                  {reservationData.drivers.map((driver, index) => (
                    <Card key={driver.id} className="border-gray-300">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <Users className="h-6 w-6 text-gray-600 mt-1" />
                            <div className="flex-1">
                              <div className="font-semibold">{driver.full_name}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                {driver.phone || 'Sin teléfono'}
                                {driver.dni_nie && ` - ${driver.dni_nie}`}
                              </div>
                              {driver.driver_license && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Carnet: {driver.driver_license}
                                  {driver.license_expiry && (
                                    <span className="ml-2">
                                      Válido hasta {new Date(driver.license_expiry).toLocaleDateString('es-ES')}
                                    </span>
                                  )}
                                </div>
                              )}
                              {(driver.driver_license_front || driver.driver_license_back || driver.id_document_front || driver.id_document_back) && (
                                <div className="flex items-center gap-1 mt-2">
                                  <FileText className="h-3 w-3 text-blue-600" />
                                  <span className="text-xs text-blue-600">
                                    {[driver.driver_license_front, driver.driver_license_back, driver.id_document_front, driver.id_document_back].filter(Boolean).length} documento(s) subido(s)
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Badge variant="outline">Adicional {index + 1}</Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleManageDocuments(driver)}
                              className="text-xs"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Documentos
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveDriver(driver.id)}
                              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-gray-200 bg-gray-50">
                  <CardContent className="p-4 text-center">
                    <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      No hay conductores adicionales en esta reserva
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Añade conductores autorizados usando el botón de arriba
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para añadir conductores */}
      <AddDriverDialog
        open={showAddDriverDialog}
        onOpenChange={setShowAddDriverDialog}
        reservation={reservationData}
        onDriverAdded={handleDriverAdded}
      />

      {/* Diálogo para gestionar documentos de un conductor */}
      <DriverDocumentsDialog
        open={showDriverDocumentsDialog}
        onOpenChange={setShowDriverDocumentsDialog}
        driverId={selectedDriver?.id || 0}
        driverName={selectedDriver?.full_name || ''}
        documents={{
          driver_license_front: selectedDriver?.driver_license_front,
          driver_license_back: selectedDriver?.driver_license_back,
          id_document_front: selectedDriver?.id_document_front,
          id_document_back: selectedDriver?.id_document_back,
        }}
        onDocumentsUpdated={handleDriverAdded}
      />
    </>
  );
}
