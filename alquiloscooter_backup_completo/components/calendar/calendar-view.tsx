
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Car } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

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

interface CalendarViewProps {
  events?: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
}

export function CalendarView({ events = [], onEventClick, onDateClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

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
    return events?.filter(event => {
      const startDate = new Date(event?.start_datetime);
      const endDate = new Date(event?.end_datetime);
      
      // Normalizar las fechas para comparación (solo fecha, sin hora)
      const eventStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const eventEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      // El evento se muestra si la fecha está dentro del rango
      return checkDate >= eventStart && checkDate <= eventEnd;
    }) || [];
  };

  // Nueva función para determinar la posición del evento en el rango de fechas
  const getEventPosition = (event: CalendarEvent, date: Date) => {
    const startDate = new Date(event?.start_datetime);
    const endDate = new Date(event?.end_datetime);
    
    const eventStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const eventEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const isFirst = checkDate.getTime() === eventStart.getTime();
    const isLast = checkDate.getTime() === eventEnd.getTime();
    const isSingle = eventStart.getTime() === eventEnd.getTime();
    
    return { isFirst, isLast, isSingle };
  };

  const getEventTypeColor = (eventType: string) => {
    const colors: Record<string, string> = {
      booking: 'bg-green-100 text-green-800 border-green-200',
      maintenance: 'bg-orange-100 text-orange-800 border-orange-200',
      inspection: 'bg-blue-100 text-blue-800 border-blue-200',
      unavailable: 'bg-red-100 text-red-800 border-red-200',
      blocked: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors?.[eventType] || 'bg-gray-100 text-gray-800 border-gray-200';
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
          className={`min-h-[100px] p-1 border-r border-b cursor-pointer hover:bg-gray-50 relative ${
            !isCurrentMonth ? 'bg-gray-100 text-gray-400' : 'bg-white'
          } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
          onClick={() => onDateClick?.(date)}
        >
          <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
            {date.getDate()}
          </div>
          
          <div className="space-y-[1px]">
            {dayEvents?.slice(0, 4)?.map((event, idx) => {
              const position = getEventPosition(event, date);
              
              // Colores más vibrantes y diferentes para cada tipo
              let eventColor = '';
              let textColor = 'text-white';
              
              switch(event?.event_type) {
                case 'booking':
                  eventColor = position.isSingle ? 'bg-green-500' : 'bg-green-400';
                  break;
                case 'maintenance':
                  eventColor = position.isSingle ? 'bg-orange-500' : 'bg-orange-400';
                  break;
                case 'inspection':
                  eventColor = position.isSingle ? 'bg-blue-500' : 'bg-blue-400';
                  break;
                default:
                  eventColor = position.isSingle ? 'bg-gray-500' : 'bg-gray-400';
              }
              
              // Estilos específicos para eventos multi-día
              let borderRadius = 'rounded-sm';
              let displayText = event?.title;
              let showDetails = true;
              
              if (!position.isSingle) {
                showDetails = position.isFirst;
                if (position.isFirst) {
                  borderRadius = 'rounded-l-sm rounded-r-none';
                  displayText = `▶ ${event?.title}`;
                } else if (position.isLast) {
                  borderRadius = 'rounded-r-sm rounded-l-none';
                  displayText = '◀';
                  showDetails = false;
                } else {
                  borderRadius = 'rounded-none';
                  displayText = '—';
                  showDetails = false;
                }
              }
              
              return (
                <div
                  key={`${event?.id}-${idx}`}
                  className={`text-xs px-2 py-1 cursor-pointer hover:opacity-80 transition-opacity ${eventColor} ${borderRadius} ${textColor} font-medium`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(event);
                  }}
                  title={`${event?.title}${event?.car ? ` - ${event?.car?.registration_number}` : ''}`}
                >
                  <div className="truncate">
                    {showDetails ? (
                      <>
                        <span className="block truncate">{displayText}</span>
                        {event?.car && (
                          <span className="text-xs opacity-90 block truncate">
                            {event?.car?.registration_number}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="flex justify-center items-center">
                        {displayText}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            
            {dayEvents?.length > 4 && (
              <div className="text-xs text-gray-500 px-1">
                +{dayEvents?.length - 4}
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <h2 className="text-xl font-semibold min-w-[200px] text-center capitalize">
                {currentDate?.toLocaleDateString('es-ES', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h2>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
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
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']?.map((day) => (
            <div key={day} className="py-2 px-3 text-center text-sm font-medium text-gray-600 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 border-r">
          {renderCalendarGrid()}
        </div>
      </CardContent>
    </Card>
  );
}
