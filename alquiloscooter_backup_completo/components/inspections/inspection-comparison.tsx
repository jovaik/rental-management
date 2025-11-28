
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mail, Download, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
// Ya no necesitamos generar PDFs en el cliente - se hace desde el navegador

interface InspectionComparisonProps {
  bookingId: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface Vehicle {
  id: number;
  make: string;
  model: string;
  registration_number: string;
}

interface Inspection {
  id: number;
  inspection_type: 'delivery' | 'return';
  inspection_date: string;
  frontal_photo?: string;
  lateral_izquierdo_photo?: string;
  trasera_photo?: string;
  lateral_derecho_photo?: string;
  odometro_photo?: string;
  damage_photos?: Array<{ url: string; description: string }>;
}

interface Booking {
  id: number;
  booking_number: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string | null;
  };
  vehicles: Array<{
    car: Vehicle;
  }>;
  pickup_date: string;
  return_date?: string;
}

export default function InspectionComparison({ bookingId, open, onOpenChange }: InspectionComparisonProps) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [deliveryInspection, setDeliveryInspection] = useState<Inspection | null>(null);
  const [returnInspection, setReturnInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    loadInspections();
  }, [bookingId]);

  const loadInspections = async () => {
    try {
      setLoading(true);
      
      // Cargar datos de la reserva
      const bookingRes = await fetch(`/api/bookings/${bookingId}`);
      if (!bookingRes.ok) throw new Error('Error cargando reserva');
      const bookingData = await bookingRes.json();
      setBooking(bookingData);

      // Cargar inspecciones
      const inspectionsRes = await fetch(`/api/inspections?bookingId=${bookingId}`);
      if (!inspectionsRes.ok) throw new Error('Error cargando inspecciones');
      const inspections = await inspectionsRes.json();

      setDeliveryInspection(inspections.find((i: Inspection) => i.inspection_type === 'delivery') || null);
      setReturnInspection(inspections.find((i: Inspection) => i.inspection_type === 'return') || null);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error cargando inspecciones');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!booking || !deliveryInspection) {
      toast.error('Faltan datos para generar PDF');
      return;
    }

    try {
      setGeneratingPDF(true);
      toast.loading('📄 Abriendo inspección...', { id: 'pdf-gen' });

      const vehicle = booking.vehicles[0]?.car;
      if (!vehicle) {
        throw new Error('No hay vehículo asociado');
      }

      // Abrir el endpoint HTML en nueva ventana
      const url = `/api/inspections/html?bookingId=${bookingId}&vehicleId=${vehicle.id}`;
      window.open(url, '_blank');

      setTimeout(() => {
        toast.success('✅ Inspección abierta. Usa Ctrl+P o el botón "Imprimir" para guardar como PDF.', { 
          id: 'pdf-gen',
          duration: 6000
        });
      }, 500);
    } catch (error) {
      console.error('Error abriendo inspección:', error);
      toast.error('Error abriendo inspección', { id: 'pdf-gen' });
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleResendEmail = async (inspectionId: number) => {
    try {
      console.log('🔔 [INICIO] Botón presionado, inspection ID:', inspectionId);
      setSendingEmail(true);
      
      // Mostrar alerta visual INMEDIATA
      alert('⏳ Enviando email... Por favor espere.');
      
      console.log('📤 [FETCH] Haciendo petición a:', `/api/inspections/${inspectionId}/resend-notification`);
      
      const res = await fetch(`/api/inspections/${inspectionId}/resend-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 [RESPUESTA] Status:', res.status, res.statusText);
      
      if (!res.ok) {
        const error = await res.json();
        console.error('❌ [ERROR RESPUESTA]:', error);
        throw new Error(error.error || 'Error enviando email');
      }

      const data = await res.json();
      console.log('✅ [ÉXITO] Respuesta:', data);
      
      // Alerta de éxito
      alert('✅ Email enviado correctamente al cliente.');
      toast.success('Email enviado correctamente', { id: 'email-send' });
    } catch (error) {
      console.error('❌ [ERROR CATCH]:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error enviando email';
      alert(`❌ ERROR: ${errorMsg}`);
      toast.error(errorMsg, { id: 'email-send' });
    } finally {
      console.log('🏁 [FIN] Proceso completado');
      setSendingEmail(false);
    }
  };

  const vehicle = booking?.vehicles[0]?.car;

  const content = booking && deliveryInspection ? (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Comparativa de Inspecciones</h2>
            <p className="text-gray-500">Reserva: {booking.booking_number}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleGeneratePDF}
              disabled={generatingPDF}
              variant="outline"
            >
              {generatingPDF ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Descargar PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-500">Cliente</p>
            <p className="font-medium">{booking.customer.first_name} {booking.customer.last_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Vehículo</p>
            <p className="font-medium">{vehicle?.make} {vehicle?.model}</p>
            <p className="text-sm text-gray-500">{vehicle?.registration_number}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Fechas</p>
            <p className="text-sm">{new Date(booking.pickup_date).toLocaleDateString('es-ES')}</p>
            {booking.return_date && (
              <p className="text-sm">{new Date(booking.return_date).toLocaleDateString('es-ES')}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Comparación de inspecciones */}
      <div className="grid grid-cols-2 gap-4">
        {/* Entrega */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Badge className="bg-green-500 mb-2">Entrega</Badge>
              <p className="text-sm text-gray-500">
                {new Date(deliveryInspection.inspection_date).toLocaleString('es-ES')}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleResendEmail(deliveryInspection.id)}
              disabled={sendingEmail}
            >
              {sendingEmail ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="space-y-4">
            {deliveryInspection.frontal_photo && (
              <div>
                <p className="text-sm font-medium mb-2">Frontal</p>
                <img
                  src={deliveryInspection.frontal_photo}
                  alt="Frontal"
                  className="w-full rounded-lg"
                />
              </div>
            )}
            {deliveryInspection.lateral_izquierdo_photo && (
              <div>
                <p className="text-sm font-medium mb-2">Lateral Izquierdo</p>
                <img
                  src={deliveryInspection.lateral_izquierdo_photo}
                  alt="Lateral Izquierdo"
                  className="w-full rounded-lg"
                />
              </div>
            )}
            {deliveryInspection.trasera_photo && (
              <div>
                <p className="text-sm font-medium mb-2">Trasera</p>
                <img
                  src={deliveryInspection.trasera_photo}
                  alt="Trasera"
                  className="w-full rounded-lg"
                />
              </div>
            )}
            {deliveryInspection.lateral_derecho_photo && (
              <div>
                <p className="text-sm font-medium mb-2">Lateral Derecho</p>
                <img
                  src={deliveryInspection.lateral_derecho_photo}
                  alt="Lateral Derecho"
                  className="w-full rounded-lg"
                />
              </div>
            )}
            {deliveryInspection.odometro_photo && (
              <div>
                <p className="text-sm font-medium mb-2">Odómetro</p>
                <img
                  src={deliveryInspection.odometro_photo}
                  alt="Odómetro"
                  className="w-full rounded-lg"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Devolución */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Badge className="bg-blue-500 mb-2">Devolución</Badge>
              {returnInspection ? (
                <p className="text-sm text-gray-500">
                  {new Date(returnInspection.inspection_date).toLocaleString('es-ES')}
                </p>
              ) : (
                <p className="text-sm text-gray-500">Pendiente</p>
              )}
            </div>
            {returnInspection && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleResendEmail(returnInspection.id)}
                disabled={sendingEmail}
              >
                {sendingEmail ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          {returnInspection ? (
            <div className="space-y-4">
              {returnInspection.frontal_photo && (
                <div>
                  <p className="text-sm font-medium mb-2">Frontal</p>
                  <img
                    src={returnInspection.frontal_photo}
                    alt="Frontal"
                    className="w-full rounded-lg"
                  />
                </div>
              )}
              {returnInspection.lateral_izquierdo_photo && (
                <div>
                  <p className="text-sm font-medium mb-2">Lateral Izquierdo</p>
                  <img
                    src={returnInspection.lateral_izquierdo_photo}
                    alt="Lateral Izquierdo"
                    className="w-full rounded-lg"
                  />
                </div>
              )}
              {returnInspection.trasera_photo && (
                <div>
                  <p className="text-sm font-medium mb-2">Trasera</p>
                  <img
                    src={returnInspection.trasera_photo}
                    alt="Trasera"
                    className="w-full rounded-lg"
                  />
                </div>
              )}
              {returnInspection.lateral_derecho_photo && (
                <div>
                  <p className="text-sm font-medium mb-2">Lateral Derecho</p>
                  <img
                    src={returnInspection.lateral_derecho_photo}
                    alt="Lateral Derecho"
                    className="w-full rounded-lg"
                  />
                </div>
              )}
              {returnInspection.odometro_photo && (
                <div>
                  <p className="text-sm font-medium mb-2">Odómetro</p>
                  <img
                    src={returnInspection.odometro_photo}
                    alt="Odómetro"
                    className="w-full rounded-lg"
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-8">
              La inspección de devolución aún no se ha realizado
            </p>
          )}
        </Card>
      </div>
    </div>
  ) : (
    <Card className="p-6">
      <p className="text-center text-gray-500">
        No hay inspecciones disponibles para esta reserva
      </p>
    </Card>
  );

  // Si se proporcionan props de dialog, envolver en Dialog
  if (open !== undefined && onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comparativa de Inspecciones</DialogTitle>
          </DialogHeader>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : !booking || !deliveryInspection ? (
            <p className="text-center text-gray-500 py-8">
              No hay inspecciones disponibles para esta reserva
            </p>
          ) : (
            content
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // Si no hay props de dialog, mostrar contenido directamente
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!booking || !deliveryInspection) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">
          No hay inspecciones disponibles para esta reserva
        </p>
      </Card>
    );
  }

  return content;
}
