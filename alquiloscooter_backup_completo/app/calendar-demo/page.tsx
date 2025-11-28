
'use client';

import { useState, useEffect } from 'react';
import { CalendarView } from '@/components/calendar/calendar-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Plus, Car, Wrench, Clock } from 'lucide-react';
import { formatDateTime, formatDate } from '@/lib/utils';

interface CalendarEvent {
  id: number | string;
  title: string;
  event_type: string;
  start_datetime: Date | string;
  end_datetime: Date | string;
  color: string;
  status: string;
  car?: {
    registration_number?: string;
    make?: string;
    model?: string;
  };
  description?: string;
}

export default function CalendarDemoPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      loadEvents();
    }
  }, [mounted]);

  const loadEvents = async () => {
    if (!mounted) return;
    
    try {
      setLoading(true);
      
      // Simular delay de API para testing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Datos de demostración con reservas multi-día
      const demoEvents: CalendarEvent[] = [
        // Reserva de un solo día - HOY
        {
          id: 1,
          title: 'Reserva Juan Pérez',
          event_type: 'booking',
          start_datetime: new Date('2025-09-26T10:00:00'),
          end_datetime: new Date('2025-09-26T18:00:00'),
          color: '#3B82F6',
          status: 'confirmed',
          car: {
            registration_number: 'N 7 3807GHX',
            make: 'Honda',
            model: 'FORZA 300'
          },
          description: 'Reserva de un día - Cliente frecuente'
        },
        // Reserva multi-día (3 días) - Como en tu captura
        {
          id: 2,
          title: 'RAQUEL ROXANA GIRALDO CABELLO',
          event_type: 'booking',
          start_datetime: new Date('2025-09-27T09:00:00'),
          end_datetime: new Date('2025-09-29T17:00:00'),
          color: '#10B981',
          status: 'finalizada',
          car: {
            registration_number: 'N 6 C2436BSR',
            make: 'Piaggio',
            model: 'ZIP 50'
          },
          description: 'Reserva de larga duración - Finalizada'
        },
        // Otra reserva multi-día (5 días) - Como en tu captura
        {
          id: 3,
          title: 'KERSTIN KIEFER',
          event_type: 'booking',
          start_datetime: new Date('2025-09-24T08:00:00'),
          end_datetime: new Date('2025-09-28T20:00:00'),
          color: '#8B5CF6',
          status: 'devuelta',
          car: {
            registration_number: 'N 46 C6489BWT',
            make: 'Piaggio',
            model: 'LIBERTY 50'
          },
          description: 'Reserva por vacaciones - Devuelta'
        },
        // Mantenimiento multi-día
        {
          id: 4,
          title: 'Mantenimiento Honda FORZA',
          event_type: 'maintenance',
          start_datetime: new Date('2025-09-30T08:00:00'),
          end_datetime: new Date('2025-10-02T17:00:00'),
          color: '#F59E0B',
          status: 'scheduled',
          car: {
            registration_number: 'N 7 3807GHX',
            make: 'Honda',
            model: 'FORZA 300'
          },
          description: 'Mantenimiento completo - 3 días'
        },
        // Reserva de una semana
        {
          id: 5,
          title: 'Reserva Ana Rodríguez (Semana completa)',
          event_type: 'booking',
          start_datetime: new Date('2025-10-05T10:00:00'),
          end_datetime: new Date('2025-10-11T18:00:00'),
          color: '#EF4444',
          status: 'confirmed',
          car: {
            registration_number: 'N 47 C6488BWT',
            make: 'Piaggio',
            model: 'LIBERTY 50'
          },
          description: 'Reserva por trabajo - Semana completa'
        },
        // Eventos adicionales para mostrar solapamientos
        {
          id: 6,
          title: 'Inspección ITV',
          event_type: 'inspection',
          start_datetime: new Date('2025-09-28T14:00:00'),
          end_datetime: new Date('2025-09-28T16:00:00'),
          color: '#06B6D4',
          status: 'scheduled',
          car: {
            registration_number: 'N 47 C6488BWT',
            make: 'Piaggio',
            model: 'LIBERTY 50'
          },
          description: 'Inspección técnica anual'
        }
      ];
      
      setEvents(demoEvents);
    } catch (error) {
      console.error('Error loading calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Car className="h-4 w-4" />;
      case 'maintenance':
        return <Wrench className="h-4 w-4" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      booking: 'Reserva',
      maintenance: 'Mantenimiento',
      inspection: 'Inspección',
      unavailable: 'No Disponible',
      blocked: 'Bloqueado',
      custom: 'Personalizado'
    };
    return labels?.[type] || type;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendario - Vista Mejorada</h1>
          <p className="text-gray-600">
            Ahora las reservas se muestran durante <strong>todos los días del período</strong> de alquiler
          </p>
        </div>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg">
          <strong>¡Nuevo!</strong> Visualización extendida de reservas
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="h-96 bg-gray-200 rounded-lg animate-pulse"></div>
          ) : (
            <CalendarView
              events={events}
              onEventClick={handleEventClick}
              onDateClick={() => {}}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Explicación de la mejora */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800 text-base">🎉 Mejora Implementada</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-700 space-y-2">
              <p><strong>Antes:</strong> Solo veías las reservas el primer día</p>
              <p><strong>Ahora:</strong> Las reservas se extienden visualmente por todos los días del alquiler</p>
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex items-center space-x-2">
                  <span>▶</span> <span>Primer día de reserva</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>—</span> <span>Días intermedios</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>◀</span> <span>Último día de reserva</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Details */}
          {selectedEvent ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detalles del Evento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium">{selectedEvent?.title}</h4>
                  <p className="text-sm text-gray-600">
                    {getEventTypeLabel(selectedEvent?.event_type)}
                  </p>
                </div>
                
                <div className="text-sm">
                  <div className="font-medium text-gray-700">Período:</div>
                  <div>{formatDateTime(selectedEvent?.start_datetime)}</div>
                  <div>hasta {formatDateTime(selectedEvent?.end_datetime)}</div>
                </div>

                {selectedEvent?.car && (
                  <div className="text-sm">
                    <div className="font-medium text-gray-700">Vehículo:</div>
                    <div>
                      {selectedEvent?.car?.registration_number} - {selectedEvent?.car?.make} {selectedEvent?.car?.model}
                    </div>
                  </div>
                )}

                {selectedEvent?.description && (
                  <div className="text-sm">
                    <div className="font-medium text-gray-700">Descripción:</div>
                    <div className="whitespace-pre-wrap">{selectedEvent?.description}</div>
                  </div>
                )}

                <Badge className="w-fit">
                  {selectedEvent?.status}
                </Badge>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Instrucciones</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p>👆 Haz clic en cualquier evento del calendario para ver sus detalles</p>
                <p>📅 Las reservas multi-día ahora se muestran conectadas visualmente</p>
                <p>🔍 Observa cómo las reservas de RAQUEL y KERSTIN se extienden por varios días</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
