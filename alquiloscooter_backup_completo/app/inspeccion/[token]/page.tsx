
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Calendar, Car, CheckCircle, Clock, Download, Fuel, Gauge, Loader2, MapPin, User, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface InspectionPhoto {
  front: string | null;
  left: string | null;
  rear: string | null;
  right: string | null;
  odometer: string | null;
}

interface Damage {
  description: string;
  severity: string | null;
  location: string | null;
  photo_url: string | null;
}

interface Extra {
  description: string;
  quantity: number;
  extra_type: string;
}

interface Vehicle {
  id: number;
  make: string;
  model: string;
  registration: string;
}

interface Inspection {
  id: number;
  type: string;
  date: string;
  vehicle_id: number | null;
  vehicle: Vehicle | null;
  photos: InspectionPhoto;
  odometer_reading: number | null;
  fuel_level: string | null;
  general_condition: string | null;
  notes: string | null;
  damages: Damage[];
  extras: Extra[];
}

interface BookingData {
  id: number;
  booking_number: string;
  pickup_date: string;
  return_date: string;
  status: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  vehicles: Array<{
    id: number;
    make: string;
    model: string;
    registration: string;
  }>;
  inspections: Inspection[];
}

export default function PublicInspectionPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadInspectionData();
  }, [token]);

  const loadInspectionData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/inspections/by-token/${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al cargar datos de inspección');
        return;
      }

      setBookingData(data.booking);
      setExpiresAt(data.expires_at);
    } catch (err) {
      console.error('Error loading inspection:', err);
      setError('Error al cargar datos de inspección');
    } finally {
      setLoading(false);
    }
  };

  const getFuelLevelLabel = (level: string | null) => {
    const levels: Record<string, string> = {
      'empty': 'Vacío',
      'quarter': '1/4',
      'half': '1/2',
      'three_quarters': '3/4',
      'full': 'Lleno'
    };
    return levels[level || ''] || level || 'N/A';
  };

  const handleDownloadPDF = async () => {
    if (!bookingData) return;
    
    try {
      setDownloading(true);
      toast.info('Abriendo inspección...');
      
      // Abrir el endpoint HTML en nueva ventana
      const url = `/api/inspections/html?bookingId=${bookingData.id}&vehicleId=${bookingData.vehicles[0]?.id}`;
      window.open(url, '_blank');

      setTimeout(() => {
        toast.success('✅ Inspección abierta. Usa Ctrl+P o el botón "Imprimir" para guardar como PDF.', { 
          duration: 6000
        });
      }, 500);
    } catch (error: any) {
      console.error('Error abriendo inspección:', error);
      toast.error('Error abriendo inspección. Por favor, intente nuevamente.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando inspección...</p>
        </div>
      </div>
    );
  }

  if (error || !bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-500 mb-2">
              <AlertCircle className="h-6 w-6" />
              <CardTitle>Error</CardTitle>
            </div>
            <CardDescription>{error || 'No se pudo cargar la inspección'}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Agrupar inspecciones por vehículo
  const vehicleInspections = bookingData.vehicles.map(vehicle => {
    const delivery = bookingData.inspections.find(
      i => i.type === 'delivery' && i.vehicle_id === vehicle.id
    );
    const returnInsp = bookingData.inspections.find(
      i => i.type === 'return' && i.vehicle_id === vehicle.id
    );
    return {
      vehicle,
      delivery,
      return: returnInsp
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto" id="inspection-content">
        {/* Header con Logo y Estilo Corporativo */}
        <div className="bg-white rounded-lg shadow-lg border-2 border-orange-500 overflow-hidden mb-6">
          {/* Franja naranja superior con logo */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-white rounded-lg p-2 shadow-md">
                  <img 
                    src="/logo.png" 
                    alt="Logo Alquiloscooter" 
                    className="h-16 w-auto object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
                <div className="text-white">
                  <h1 className="text-2xl sm:text-3xl font-bold">Alquiloscooter</h1>
                  <p className="text-orange-100 text-sm">Alquiler de motos y scooters</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-white text-orange-600 border-white text-lg font-bold px-4 py-2">
                Contrato {bookingData.booking_number}
              </Badge>
            </div>
          </div>
          
          {/* Contenido del header */}
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            
            {/* Botón de Descarga */}
            <Button
              onClick={handleDownloadPDF}
              disabled={downloading}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white shadow-md"
            >
              {downloading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generando PDF...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  Descargar PDF
                </>
              )}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Cliente:</span>
              <span>{bookingData.customer.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Salida:</span>
              <span>{bookingData.pickup_date ? format(new Date(bookingData.pickup_date), 'dd/MM/yyyy', { locale: es }) : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Devolución:</span>
              <span>{bookingData.return_date ? format(new Date(bookingData.return_date), 'dd/MM/yyyy', { locale: es }) : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Vehículos:</span>
              <span>{bookingData.vehicles.length}</span>
            </div>
          </div>

          {expiresAt && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>Este enlace expira el {format(new Date(expiresAt), 'dd/MM/yyyy', { locale: es })}</span>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Comparativa de Inspecciones por Vehículo */}
        {vehicleInspections.map(({ vehicle, delivery, return: returnInsp }, idx) => (
          <div key={vehicle.id} className="mb-8">
            {/* Título del Vehículo */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-md p-4 mb-4">
              <div className="flex items-center justify-between text-white">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Car className="h-6 w-6" />
                    {vehicle.make} {vehicle.model}
                  </h2>
                  <p className="text-orange-100 text-sm mt-1">
                    Matrícula: {vehicle.registration}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-orange-100">Vehículo {idx + 1} de {vehicleInspections.length}</p>
                </div>
              </div>
            </div>

            {/* Encabezados de Entrega y Devolución */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Entrega */}
              <div className="flex flex-col items-center gap-2 bg-green-50 border-2 border-green-300 rounded-lg py-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div className="text-center">
                    <p className="font-semibold text-green-900">Entrega</p>
                    {delivery && (
                      <p className="text-xs text-green-700">
                        {format(new Date(delivery.date), 'dd/MM/yyyy', { locale: es })}
                      </p>
                    )}
                  </div>
                </div>
                {delivery && (
                  <div className="text-center space-y-1 mt-2">
                    <div className="text-sm">
                      <Gauge className="inline h-3 w-3 mr-1" />
                      <span className="font-medium">{delivery.odometer_reading || 'N/A'} km</span>
                    </div>
                    <div className="text-sm">
                      <Fuel className="inline h-3 w-3 mr-1" />
                      <span className="font-medium">{getFuelLevelLabel(delivery.fuel_level)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Devolución */}
              <div className="flex flex-col items-center gap-2 bg-blue-50 border-2 border-blue-300 rounded-lg py-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <div className="text-center">
                    <p className="font-semibold text-blue-900">Devolución</p>
                    {returnInsp && (
                      <p className="text-xs text-blue-700">
                        {format(new Date(returnInsp.date), 'dd/MM/yyyy', { locale: es })}
                      </p>
                    )}
                  </div>
                </div>
                {returnInsp && (
                  <div className="text-center space-y-1 mt-2">
                    <div className="text-sm">
                      <Gauge className="inline h-3 w-3 mr-1" />
                      <span className="font-medium">{returnInsp.odometer_reading || 'N/A'} km</span>
                    </div>
                    <div className="text-sm">
                      <Fuel className="inline h-3 w-3 mr-1" />
                      <span className="font-medium">{getFuelLevelLabel(returnInsp.fuel_level)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Comparativa de Fotos */}
            {(delivery || returnInsp) && (
              <div className="space-y-6 mb-6">
                {[
                  { 
                    label: 'Frontal', 
                    deliveryUrl: delivery?.photos?.front, 
                    returnUrl: returnInsp?.photos?.front,
                    height: 'h-56 sm:h-64'
                  },
                  { 
                    label: 'Lateral Izquierdo', 
                    deliveryUrl: delivery?.photos?.left, 
                    returnUrl: returnInsp?.photos?.left,
                    height: 'h-48 sm:h-56'
                  },
                  { 
                    label: 'Trasera', 
                    deliveryUrl: delivery?.photos?.rear, 
                    returnUrl: returnInsp?.photos?.rear,
                    height: 'h-56 sm:h-64'
                  },
                  { 
                    label: 'Lateral Derecho', 
                    deliveryUrl: delivery?.photos?.right, 
                    returnUrl: returnInsp?.photos?.right,
                    height: 'h-48 sm:h-56'
                  },
                  { 
                    label: 'Cuentakilómetros', 
                    deliveryUrl: delivery?.photos?.odometer, 
                    returnUrl: returnInsp?.photos?.odometer,
                    height: 'h-48 sm:h-56'
                  }
                ].map((comparison, idx) => (
                  <div key={idx} className="border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    {/* Título de la posición */}
                    <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 border-b-2 border-gray-200">
                      <h4 className="font-bold text-gray-900 text-center text-lg">
                        📸 {comparison.label}
                      </h4>
                    </div>
                    
                    {/* Grid de comparación: Entrega | Devolución */}
                    <div className="grid grid-cols-2 gap-0 divide-x-2 divide-gray-200">
                      {/* Foto de Entrega */}
                      <div className="p-3 bg-green-50/30">
                        {comparison.deliveryUrl ? (
                          <div className={`relative w-full ${comparison.height} bg-white rounded border border-green-200`}>
                            <Image
                              src={comparison.deliveryUrl}
                              alt={`${comparison.label} - Entrega`}
                              fill
                              className="object-contain p-2"
                              unoptimized
                              onError={(e) => {
                                console.error('❌ Error cargando imagen de entrega:', comparison.label);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div className={`relative w-full ${comparison.height} bg-gray-100 rounded border border-dashed border-gray-300 flex items-center justify-center`}>
                            <div className="text-center">
                              <XCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                              <p className="text-xs text-gray-500">Sin foto</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Foto de Devolución */}
                      <div className="p-3 bg-blue-50/30">
                        {comparison.returnUrl ? (
                          <div className={`relative w-full ${comparison.height} bg-white rounded border border-blue-200`}>
                            <Image
                              src={comparison.returnUrl}
                              alt={`${comparison.label} - Devolución`}
                              fill
                              className="object-contain p-2"
                              unoptimized
                              onError={(e) => {
                                console.error('❌ Error cargando imagen de devolución:', comparison.label);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div className={`relative w-full ${comparison.height} bg-gray-100 rounded border border-dashed border-gray-300 flex items-center justify-center`}>
                            <div className="text-center">
                              <XCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                              <p className="text-xs text-gray-500">Sin foto</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Notas */}
            {(delivery?.notes || returnInsp?.notes) && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Observaciones de Entrega:</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {delivery?.notes || 'Sin observaciones'}
                  </p>
                </div>
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Observaciones de Devolución:</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {returnInsp?.notes || 'Sin observaciones'}
                  </p>
                </div>
              </div>
            )}

            {/* Daños */}
            {(delivery?.damages?.length || returnInsp?.damages?.length) ? (
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Daños de Entrega */}
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Daños en Entrega
                  </h4>
                  {delivery?.damages && delivery.damages.length > 0 ? (
                    <div className="space-y-2">
                      {delivery.damages.map((damage, idx) => (
                        <div key={idx} className="bg-white border border-green-200 rounded p-2">
                          <p className="text-sm font-medium">{damage.description}</p>
                          {damage.severity && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {damage.severity === 'minor' && 'Menor'}
                              {damage.severity === 'moderate' && 'Moderado'}
                              {damage.severity === 'severe' && 'Grave'}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">Sin daños reportados</p>
                  )}
                </div>

                {/* Daños de Devolución */}
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Daños en Devolución
                  </h4>
                  {returnInsp?.damages && returnInsp.damages.length > 0 ? (
                    <div className="space-y-2">
                      {returnInsp.damages.map((damage, idx) => (
                        <div key={idx} className="bg-white border border-blue-200 rounded p-2">
                          <p className="text-sm font-medium">{damage.description}</p>
                          {damage.severity && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {damage.severity === 'minor' && 'Menor'}
                              {damage.severity === 'moderate' && 'Moderado'}
                              {damage.severity === 'severe' && 'Grave'}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">Sin daños reportados</p>
                  )}
                </div>
              </div>
            ) : null}

            {!delivery && !returnInsp && (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="h-5 w-5" />
                    Sin Inspecciones
                  </CardTitle>
                  <CardDescription className="text-yellow-700">
                    No hay inspecciones registradas para este vehículo
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            <Separator className="my-8" />
          </div>
        ))}

        {/* Si no hay inspecciones en absoluto */}
        {bookingData.inspections.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Sin Inspecciones
              </CardTitle>
              <CardDescription>
                Aún no se han realizado inspecciones para este contrato
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}
