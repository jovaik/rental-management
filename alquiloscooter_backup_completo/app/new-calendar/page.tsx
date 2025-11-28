
'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarEvent {
  id: number | string;
  title: string;
  event_type: string;
  start_datetime: Date;
  end_datetime: Date;
  color: string;
  status: string;
  car?: {
    registration_number?: string;
    make?: string;
    model?: string;
  };
  description?: string;
}

export default function NewCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    // Eventos de demostración con reservas multi-día
    const demoEvents: CalendarEvent[] = [
      {
        id: 1,
        title: 'Reserva Juan Pérez',
        event_type: 'booking',
        start_datetime: new Date('2025-09-26T10:00:00'),
        end_datetime: new Date('2025-09-26T18:00:00'),
        color: '#10B981',
        status: 'confirmed',
        car: {
          registration_number: 'N 7 3807GHX',
          make: 'Honda',
          model: 'FORZA 300'
        },
        description: 'Reserva de un día'
      },
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
        description: 'Reserva 3 días - Finalizada'
      },
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
        description: 'Reserva 5 días - Devuelta'
      },
      {
        id: 4,
        title: 'Mantenimiento Honda',
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
        description: 'Mantenimiento 3 días'
      },
      {
        id: 5,
        title: 'Alquiler Ana Rodríguez',
        event_type: 'booking',
        start_datetime: new Date('2025-10-01T10:00:00'),
        end_datetime: new Date('2025-10-04T18:00:00'),
        color: '#10B981',
        status: 'confirmed',
        car: {
          registration_number: 'N 47 C6488BWT',
          make: 'Piaggio',
          model: 'LIBERTY 50'
        },
        description: 'Alquiler 4 días'
      }
    ];
    
    setEvents(demoEvents);
  }, []);

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startOfCalendar = new Date(startOfMonth);
  startOfCalendar.setDate(startOfCalendar.getDate() - startOfCalendar.getDay());

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

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

  const renderCalendarGrid = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startOfCalendar);
      date.setDate(startOfCalendar.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === currentDate.getMonth();
      const isToday = date.toDateString() === today.toDateString();
      const dayEvents = getEventsForDate(date);
      
      days.push(
        <div
          key={i}
          className={`min-h-[120px] p-2 border-r border-b cursor-pointer hover:bg-gray-50 ${
            !isCurrentMonth ? 'bg-gray-100 text-gray-400' : 'bg-white'
          } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
        >
          <div className={`text-sm font-semibold mb-2 ${isToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
            {date.getDate()}
          </div>
          
          <div className="space-y-1">
            {dayEvents.slice(0, 4).map((event, idx) => {
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
                  title={`${event.title}${event.car ? ` - ${event.car.registration_number}` : ''}`}
                >
                  <div className="truncate">
                    {showDetails ? (
                      <>
                        <span className="block truncate">{displayText}</span>
                        {event.car && (
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
            
            {dayEvents.length > 4 && (
              <div className="text-xs text-gray-500 px-1">
                +{dayEvents.length - 4}
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  <h2 className="text-xl font-semibold min-w-[200px] text-center capitalize">
                    {currentDate.toLocaleDateString('es-ES', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </h2>
                  
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
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
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
              <div key={day} className="py-3 px-4 text-center text-sm font-medium text-gray-600 border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {renderCalendarGrid()}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">🎉 Calendario Mejorado - Vista Visual</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>✅ <strong>Antes:</strong> Solo veías las reservas el primer día</p>
            <p>✅ <strong>Ahora:</strong> Las reservas se extienden visualmente por todos los días del alquiler</p>
            <p>✅ Observa cómo las reservas de RAQUEL (3 días) y KERSTIN (5 días) se muestran conectadas</p>
            <p>✅ Los eventos multi-día usan: ▶ (inicio), — (continúa), ◀ (fin)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
