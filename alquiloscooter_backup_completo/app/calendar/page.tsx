
'use client';

import { useState, useEffect } from 'react';
import { CalendarView } from '@/components/calendar/calendar-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Plus, Car, Wrench, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateTime, formatDate } from '@/lib/utils';
import { RoleGuard } from '@/components/auth/role-guard';
import { CalendarEventModal } from '@/components/modals/calendar-event-modal';
import { ReservationModal } from '@/components/modals/reservation-modal';

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

export default function CalendarPage() {
  return (
    <RoleGuard allowedRoles={['super_admin', 'admin', 'operador']}>
      <CalendarPageContent />
    </RoleGuard>
  );
}

function CalendarPageContent() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    
    // Cargar vehículos desde la API
    const loadVehicles = async () => {
      try {
        const response = await fetch('/api/vehicles');
        if (response.ok) {
          const data = await response.json();
          setVehicles(data);
        }
      } catch (error) {
        console.error('Error loading vehicles:', error);
      }
    };
    
    loadVehicles();
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
      
      // Cargar reservas REALES desde la base de datos
      const bookingsResponse = await fetch('/api/bookings');
      const maintenanceResponse = await fetch('/api/calendar');
      
      const loadedEvents: CalendarEvent[] = [];
      
      // Cargar reservas (bookings)
      if (bookingsResponse.ok) {
        const bookings = await bookingsResponse.json();
        const bookingEvents = bookings.map((booking: any) => ({
          id: `booking-${booking.id}`,
          title: `Reserva: ${booking.customer_name}`,
          event_type: 'booking',
          start_datetime: new Date(booking.pickup_date),
          end_datetime: new Date(booking.return_date),
          color: booking.status === 'confirmed' ? '#10B981' : '#F59E0B',
          status: booking.status,
          car: booking.car ? {
            registration_number: booking.car.registration_number,
            make: booking.car.make,
            model: booking.car.model
          } : undefined,
          description: `Cliente: ${booking.customer_name}\nTeléfono: ${booking.customer_phone}\nEmail: ${booking.customer_email}`
        }));
        loadedEvents.push(...bookingEvents);
      }
      
      // Cargar eventos de calendario (mantenimiento, etc.)
      if (maintenanceResponse.ok) {
        const calendarEvents = await maintenanceResponse.json();
        const formattedEvents = calendarEvents.map((event: any) => ({
          id: `calendar-${event.id}`,
          title: event.title,
          event_type: event.event_type,
          start_datetime: new Date(event.start_datetime),
          end_datetime: new Date(event.end_datetime),
          color: event.color || '#3B82F6',
          status: event.status,
          car: event.car ? {
            registration_number: event.car.registration_number,
            make: event.car.make,
            model: event.car.model
          } : undefined,
          description: event.description
        }));
        loadedEvents.push(...formattedEvents);
      }
      
      setEvents(loadedEvents);
    } catch (error) {
      console.error('Error loading calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewEventClick = () => {
    setEditingEvent(null);
    setSelectedDate(null);
    setIsEventModalOpen(true);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsReservationModalOpen(true);
  };

  const handleReservationSave = async (reservation: any) => {
    try {
      // Guardar la reserva en la base de datos a través de la API
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          car_id: reservation.vehicleId || reservation.car_id,
          customer_name: reservation.customer?.fullName || reservation.title,
          customer_email: reservation.customer?.email || '',
          customer_phone: reservation.customer?.phone || '',
          pickup_date: reservation.start_datetime,
          return_date: reservation.end_datetime,
          total_price: reservation.total_price || 0,
          status: 'confirmed'
        })
      });

      if (response.ok) {
        // Recargar eventos desde la base de datos
        await loadEvents();
      } else {
        const error = await response.json();
        alert(error.message || 'Error al crear la reserva');
      }
    } catch (error) {
      console.error('Error saving reservation:', error);
      alert('Error al guardar la reserva');
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setSelectedDate(null);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (eventData: CalendarEvent) => {
    try {
      // Guardar evento en la base de datos a través de la API
      const endpoint = editingEvent ? `/api/calendar/${editingEvent.id}` : '/api/calendar';
      const method = editingEvent ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        // Recargar eventos desde la base de datos
        await loadEvents();
        setEditingEvent(null);
        setSelectedDate(null);
      } else {
        const error = await response.json();
        alert(error.message || 'Error al guardar el evento');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error al guardar el evento');
    }
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

  const todayEvents = events?.filter(event => {
    const eventDate = new Date(event?.start_datetime);
    const today = new Date();
    return eventDate?.toDateString() === today?.toDateString();
  }) || [];

  const upcomingEvents = events?.filter(event => {
    const eventDate = new Date(event?.start_datetime);
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    return eventDate > today && eventDate <= nextWeek;
  })?.slice(0, 5) || [];

  // Funciones de navegación
  const navigateDate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (viewMode === 'month') {
        newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      } else {
        newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      }
      return newDate;
    });
  };

  const getDateRangeText = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('es-ES', { 
        month: 'long', 
        year: 'numeric' 
      });
    } else {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${endOfWeek.toLocaleDateString('es-ES', { 
        month: 'long', 
        year: 'numeric' 
      })}`;
    }
  };

  // Funciones auxiliares para el calendario
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const startDate = new Date(event.start_datetime);
      const endDate = new Date(event.end_datetime);
      
      const eventStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const eventEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      return checkDate >= eventStart && checkDate <= eventEnd;
    });
  };

  const getEventPosition = (event: CalendarEvent, date: Date) => {
    const startDate = new Date(event.start_datetime);
    const endDate = new Date(event.end_datetime);
    
    const eventStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const eventEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const isFirst = checkDate.getTime() === eventStart.getTime();
    const isLast = checkDate.getTime() === eventEnd.getTime();
    const isSingle = eventStart.getTime() === eventEnd.getTime();
    
    return { isFirst, isLast, isSingle };
  };

  // Función para renderizar una celda del calendario
  const renderCalendarCell = (date: Date, isCurrentPeriod: boolean, isToday: boolean) => {
    const dayEvents = getEventsForDate(date);
    
    return (
      <div
        key={date.toDateString()}
        className={`${viewMode === 'week' ? 'min-h-[150px]' : 'min-h-[120px]'} p-2 border-r border-b cursor-pointer hover:bg-gray-50 ${
          !isCurrentPeriod ? 'bg-gray-100 text-gray-400' : 'bg-white'
        } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
        onClick={() => handleDateClick(date)}
      >
        <div className={`text-sm font-semibold mb-2 ${isToday ? 'text-blue-600' : isCurrentPeriod ? 'text-gray-900' : 'text-gray-400'}`}>
          {date.getDate()}
        </div>
        
        <div className="space-y-1">
          {dayEvents.slice(0, viewMode === 'week' ? 6 : 4).map((event, idx) => {
            const position = getEventPosition(event, date);
            
            let eventColor = '';
            let textColor = 'text-white';
            
            switch(event.event_type) {
              case 'booking':
                eventColor = 'bg-green-500';
                break;
              case 'maintenance':
                eventColor = 'bg-orange-500';
                break;
              case 'inspection':
                eventColor = 'bg-blue-500';
                break;
              default:
                eventColor = 'bg-gray-500';
            }
            
            let borderRadius = 'rounded-sm';
            let displayText = event.title;
            let showDetails = true;
            
            if (!position.isSingle) {
              showDetails = position.isFirst;
              if (position.isFirst) {
                borderRadius = 'rounded-l-sm rounded-r-none';
                displayText = `▶ ${event.title}`;
              } else if (position.isLast) {
                borderRadius = 'rounded-r-sm rounded-l-none';
                displayText = '◀ Continúa...';
                showDetails = false;
              } else {
                borderRadius = 'rounded-none';
                displayText = '— Continúa...';
                showDetails = false;
              }
            }
            
            return (
              <div
                key={`${event.id}-${idx}`}
                className={`text-xs px-2 py-1 cursor-pointer hover:opacity-80 ${eventColor} ${borderRadius} ${textColor} font-medium`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEventClick(event);
                }}
                title={`${event.title}${event.car ? ` - ${event.car.registration_number}` : ''}`}
              >
                <div className="truncate">
                  {showDetails ? (
                    <>
                      <span className="block truncate">{displayText}</span>
                      {event.car && viewMode === 'week' && (
                        <span className="text-xs opacity-90 block truncate">
                          {event.car.registration_number}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="flex justify-center items-center text-xs">
                      {displayText}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          
          {dayEvents.length > (viewMode === 'week' ? 6 : 4) && (
            <div className="text-xs text-gray-500 px-1">
              +{dayEvents.length - (viewMode === 'week' ? 6 : 4)}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Función para renderizar el grid del calendario
  const renderCalendarGrid = () => {
    const days = [];
    const today = new Date();
    
    if (viewMode === 'month') {
      // Vista mensual - lógica existente
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const startOfCalendar = new Date(startOfMonth);
      startOfCalendar.setDate(startOfCalendar.getDate() - startOfCalendar.getDay());
      
      for (let i = 0; i < 42; i++) {
        const date = new Date(startOfCalendar);
        date.setDate(startOfCalendar.getDate() + i);
        
        const isCurrentMonth = date.getMonth() === currentDate.getMonth();
        const isToday = date.toDateString() === today.toDateString();
        
        days.push(renderCalendarCell(date, isCurrentMonth, isToday));
      }
    } else {
      // Vista semanal - nueva lógica
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        
        const isToday = date.toDateString() === today.toDateString();
        
        days.push(renderCalendarCell(date, true, isToday));
      }
    }
    
    return days;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendario de Actividades</h1>
          <p className="text-gray-600">
            Vista completa de reservas, mantenimientos y eventos
          </p>
        </div>
        <div className="flex gap-2">
          {/* Vista Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'month' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📅 Mensual
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'week' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🗓️ Semanal
            </button>
          </div>
          <Button onClick={() => setIsReservationModalOpen(true)} className="bg-green-600 hover:bg-green-700">
            <Car className="h-4 w-4 mr-2" />
            Nueva Reserva
          </Button>
          <Button onClick={handleNewEventClick} variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
            <Plus className="h-4 w-4 mr-2" />
            Otro Evento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="h-96 bg-gray-200 rounded-lg animate-pulse"></div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm">
              {/* Header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigateDate('prev')}
                        className="p-2 hover:bg-gray-100 rounded"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      
                      <h2 className="text-xl font-semibold min-w-[250px] text-center capitalize">
                        {getDateRangeText()}
                      </h2>
                      
                      <button
                        onClick={() => navigateDate('next')}
                        className="p-2 hover:bg-gray-100 rounded"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {/* Indicador de vista actual */}
                    <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">
                        {viewMode === 'month' ? '📅 Vista Mensual' : '🗓️ Vista Semanal'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                      <span>Reservas</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
                      <span>Mantenimiento</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                      <span>Inspección</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Calendar Header */}
              <div className="grid grid-cols-7 border-b bg-gray-50">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, idx) => (
                  <div key={day} className="py-3 px-4 text-center text-sm font-medium text-gray-600 border-r last:border-r-0">
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{['D', 'L', 'M', 'X', 'J', 'V', 'S'][idx]}</span>
                  </div>
                ))}
              </div>
              
              {/* Calendar Grid */}
              <div className={`grid grid-cols-7 ${viewMode === 'week' ? 'min-h-[150px]' : ''}`}>
                {renderCalendarGrid()}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Today's Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Hoy</span>
                <Badge variant="secondary">{todayEvents?.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayEvents?.length > 0 ? (
                todayEvents?.map((event) => (
                  <div
                    key={event?.id}
                    className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {getEventTypeIcon(event?.event_type)}
                      <span className="text-sm font-medium">{event?.title}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {formatDateTime(event?.start_datetime)}
                    </div>
                    {event?.car && (
                      <div className="text-xs text-gray-500 mt-1">
                        {event?.car?.registration_number}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No hay eventos hoy</p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5" />
                <span>Próximos</span>
                <Badge variant="secondary">{upcomingEvents?.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents?.length > 0 ? (
                upcomingEvents?.map((event) => (
                  <div
                    key={event?.id}
                    className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {getEventTypeIcon(event?.event_type)}
                      <span className="text-sm font-medium">{event?.title}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {formatDate(event?.start_datetime)}
                    </div>
                    {event?.car && (
                      <div className="text-xs text-gray-500 mt-1">
                        {event?.car?.registration_number}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No hay eventos próximos</p>
              )}
            </CardContent>
          </Card>

          {/* Event Details */}
          {selectedEvent && (
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
                  <div className="font-medium text-gray-700">Fecha y Hora:</div>
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
          )}
        </div>
      </div>

      {/* Modal de eventos */}
      <CalendarEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
        event={editingEvent}
        selectedDate={selectedDate || undefined}
      />

      {/* Modal de reservas */}
      <ReservationModal
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        onSave={handleReservationSave}
        selectedDate={selectedDate || undefined}
        vehicles={vehicles}
        existingEvents={events}
      />
    </div>
  );
}
